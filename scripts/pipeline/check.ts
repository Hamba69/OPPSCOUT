/**
 * Catalogue health check against the live database. It answers "can a seeker see anything?" and,
 * when the answer is no, "why not?". Run it weekly (the scheduled workflow does) and after any import.
 *
 *   npm run seed:check -- [--phase build|fill|steady] [--pass-rate 0.6] [--min-visible N] [--min-matches 3] [--require-coverage] [--out file]
 *
 * Also writes research-plan.json next to the re-check queue: how many candidates of each category the
 * catalogue owner should research this week to reach and hold the targets in src/config/catalogue-targets.ts.
 *
 * Exits non-zero if too few records are visible, so a silently empty catalogue pages somebody.
 */
import { join } from "node:path";

import { CATALOGUE_PHASES, DEFAULT_PASS_RATE, researchPlan, type CataloguePhase } from "../../src/config/catalogue-targets";
import { INGESTION_RULES } from "../../src/config/ingestion-rules";
import { computeCoverage } from "../../src/services/seeding/personas";
import { recheckIntervalDays } from "../../src/services/seeding/source-tiers";
import { visibilityFailures } from "../../src/services/trust/user-publication-policy";
import { bar, ensureDir, getClient, loadCatalogue, numberFlag, parseArgs, parseNow, writeJson } from "./lib";

const { flags } = parseArgs(process.argv.slice(2));
const DAY = 86_400_000;

async function main(): Promise<void> {
  const now = parseNow(flags);
  const phaseFlag = String(flags.get("phase") ?? "steady");
  if (!(phaseFlag in CATALOGUE_PHASES)) throw new Error(`--phase must be one of ${Object.keys(CATALOGUE_PHASES).join(", ")}`);
  const phase = phaseFlag as CataloguePhase;
  const minVisible = numberFlag(flags, "min-visible", CATALOGUE_PHASES[phase].minVisible);
  const passRate = numberFlag(flags, "pass-rate", DEFAULT_PASS_RATE);
  const minMatches = numberFlag(flags, "min-matches", 3);
  const { opportunities } = await loadCatalogue(getClient());
  const live = opportunities.filter((opportunity) => opportunity.status !== "removed");

  const reasons = new Map<string, number>();
  const visible = live.filter((opportunity) => {
    const failures = visibilityFailures(opportunity, now);
    for (const failure of failures) reasons.set(failure.replace(/: .*/, ""), (reasons.get(failure.replace(/: .*/, "")) ?? 0) + 1);
    return failures.length === 0;
  });
  const verifiedButHidden = live.filter((opportunity) => opportunity.verificationStatus === "verified" && visibilityFailures(opportunity, now).length > 0);
  const withRunway = visible.filter((opportunity) => opportunity.deadline === null || opportunity.deadline.getTime() - now.getTime() >= 30 * DAY);

  console.log(`${bar("=")}\nCatalogue health at ${now.toISOString()}\n${bar("=")}`);
  console.log(`  records (not removed)      ${live.length}\n  verified                   ${live.filter((o) => o.verificationStatus === "verified").length}\n  VISIBLE TO SEEKERS         ${visible.length}\n  visible, 30+ days left     ${withRunway.length}\n  verified but hidden        ${verifiedButHidden.length}`);
  const categories = new Map<string, number>();
  for (const opportunity of visible) categories.set(opportunity.category, (categories.get(opportunity.category) ?? 0) + 1);
  console.log(`  visible by category        ${[...categories].map(([name, count]) => `${name} ${count}`).join(", ") || "none"}`);

  const plan = researchPlan(categories, phase, passRate);
  console.log(`\nResearch plan, phase "${phase}" (${CATALOGUE_PHASES[phase].label}), pass rate ${passRate}`);
  console.log(`  ${"category".padEnd(12)} ${"visible".padStart(7)} ${"target".padStart(6)} ${"replace/wk".padStart(10)} ${"approve/wk".padStart(10)} ${"research/wk".padStart(11)}`);
  for (const row of plan) console.log(`  ${row.category.padEnd(12)} ${String(row.visible).padStart(7)} ${String(row.target).padStart(6)} ${String(row.weeklyReplacement).padStart(10)} ${String(row.approvalsThisWeek).padStart(10)} ${String(row.candidatesThisWeek).padStart(11)}`);
  const totalCandidates = plan.reduce((sum, row) => sum + row.candidatesThisWeek, 0);
  console.log(`  total: research about ${totalCandidates} candidates this week (${Math.ceil(totalCandidates / 25)} batches of 25).`);

  if (verifiedButHidden.length) {
    console.log("\nWhy verified records are hidden");
    const hiddenReasons = new Map<string, number>();
    for (const opportunity of verifiedButHidden) for (const failure of visibilityFailures(opportunity, now)) hiddenReasons.set(failure, (hiddenReasons.get(failure) ?? 0) + 1);
    for (const [reason, count] of [...hiddenReasons].sort((a, b) => b[1] - a[1])) console.log(`  ${String(count).padStart(4)}  ${reason}`);
  }

  const coverage = await computeCoverage(visible, { now, minMatches });
  console.log("\nCoverage (matches per typical seeker, at least 45 days left)");
  for (const row of coverage) console.log(`  ${row.meetsTarget ? "ok  " : "LOW "} ${row.label.padEnd(32)} ${String(row.matchedWithRunway).padStart(3)} with runway, ${String(row.matched).padStart(3)} matched, ${String(row.eligible).padStart(3)} eligible`);

  const queue = live
    .filter((opportunity) => (opportunity.verificationStatus === "verified" || visibilityFailures(opportunity, now).length === 0) && ["open", "closing_soon"].includes(opportunity.status) && (opportunity.deadline === null || opportunity.deadline > now))
    .map((opportunity) => ({ opportunity, ageDays: (now.getTime() - opportunity.checkedAt.getTime()) / DAY }))
    .filter(({ opportunity, ageDays }) => ageDays > recheckIntervalDays(opportunity.category))
    .sort((a, b) => b.ageDays - a.ageDays)
    .map(({ opportunity, ageDays }) => ({ id: opportunity.id, title: opportunity.title, category: opportunity.category, sourceUrl: opportunity.sourceUrl, deadline: opportunity.deadline?.toISOString() ?? null, daysSinceChecked: Math.floor(ageDays) }));
  const atRisk = queue.filter((item) => item.daysSinceChecked >= INGESTION_RULES.scrapedStaleAfterDays - 4);
  const outFile = typeof flags.get("out") === "string" ? String(flags.get("out")) : join("imports", "seeding-runs", "recheck-queue.json");
  ensureDir(join(outFile, ".."));
  writeJson(outFile, queue);
  writeJson(join(outFile, "..", "research-plan.json"), { generatedAt: now.toISOString(), phase, passRate, totalCandidates, batchesOf25: Math.ceil(totalCandidates / 25), categories: plan });
  console.log(`\nDue for re-check: ${queue.length} (written to ${outFile}).`);
  if (atRisk.length) console.log(`WARNING: ${atRisk.length} record(s) are within 4 days of being removed automatically as stale (${INGESTION_RULES.scrapedStaleAfterDays} days without a re-check).`);

  let failed = false;
  if (visible.length < minVisible) { console.error(`\nFAILED: only ${visible.length} record(s) are visible to seekers (minimum ${minVisible}).`); failed = true; }
  if (flags.has("require-coverage") && coverage.some((row) => !row.meetsTarget)) { console.error(`\nFAILED: some seekers have fewer than ${minMatches} matches.`); failed = true; }
  if (failed) process.exitCode = 1;
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
