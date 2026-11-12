/**
 * Catalogue health check against the live database. It answers "can a seeker see anything?" and,
 * when the answer is no, "why not?". Run it weekly (the scheduled workflow does) and after any import.
 *
 *   npm run seed:check -- [--min-visible 10] [--min-matches 3] [--require-coverage] [--out file]
 *
 * Exits non-zero if too few records are visible, so a silently empty catalogue pages somebody.
 */
import { join } from "node:path";

import { INGESTION_RULES } from "../../src/config/ingestion-rules";
import { computeCoverage } from "../../src/services/seeding/personas";
import { recheckIntervalDays } from "../../src/services/seeding/source-tiers";
import { visibilityFailures } from "../../src/services/trust/user-publication-policy";
import { bar, ensureDir, getClient, loadCatalogue, numberFlag, parseArgs, parseNow, writeJson } from "./lib";

const { flags } = parseArgs(process.argv.slice(2));
const DAY = 86_400_000;

async function main(): Promise<void> {
  const now = parseNow(flags);
  const minVisible = numberFlag(flags, "min-visible", 10);
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
  console.log(`\nDue for re-check: ${queue.length} (written to ${outFile}).`);
  if (atRisk.length) console.log(`WARNING: ${atRisk.length} record(s) are within 4 days of being removed automatically as stale (${INGESTION_RULES.scrapedStaleAfterDays} days without a re-check).`);

  let failed = false;
  if (visible.length < minVisible) { console.error(`\nFAILED: only ${visible.length} record(s) are visible to seekers (minimum ${minVisible}).`); failed = true; }
  if (flags.has("require-coverage") && coverage.some((row) => !row.meetsTarget)) { console.error(`\nFAILED: some seekers have fewer than ${minMatches} matches.`); failed = true; }
  if (failed) process.exitCode = 1;
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
