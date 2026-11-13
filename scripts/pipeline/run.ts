/**
 * Seeding pipeline, stages 1-3: validate candidate records the research agent produced, run the
 * quality gate, report what survives each stage, and (with --apply) stage the survivors as PENDING.
 * Nothing is shown to users until `npm run seed:publish` approves them.
 *
 *   npm run seed:run [-- <candidates.json|folder>] [--apply] [--offline] [--out dir]
 *        [--allow-aggregators-for-review] [--include-evidence-held-for-review]
 *        [--min-lead-days 14] [--min-matches 3] [--require-coverage] [--now ISO]
 *   Without an input path, all JSON files in imports/seeding-runs/inbox are processed.
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Opportunity } from "../../src/core/entities/domain";
import { candidateToOpportunity } from "../../src/services/seeding/candidate";
import { computeCoverage, type PersonaCoverage } from "../../src/services/seeding/personas";
import { runSeedingPipeline, type AcceptedRecord, type HeldRecord } from "../../src/services/seeding/pipeline";
import { buildReviewChecklist } from "../../src/services/trust/checklist";
import { visibilityFailures } from "../../src/services/trust/user-publication-policy";
import { bar, ensureDir, getClient, hasDeadlineTypeColumn, journal, loadCatalogue, numberFlag, parseArgs, parseNow, readCandidates, runIdFor, writeJson, type Row } from "./lib";

const { positional, flags } = parseArgs(process.argv.slice(2));

function table(rows: Array<[string, string | number]>): string {
  return rows.map(([label, value]) => `  ${label.padEnd(22)} ${value}`).join("\n");
}

function coverageLines(coverage: PersonaCoverage[]): string {
  return coverage.map((row) => `  ${row.meetsTarget ? "ok  " : "LOW "} ${row.label.padEnd(32)} ${String(row.matchedWithRunway).padStart(3)} with runway, ${String(row.matched).padStart(3)} matched, ${String(row.eligible).padStart(3)} eligible`).join("\n");
}

async function main(): Promise<void> {
  const input = positional[0] ?? join("imports", "seeding-runs", "inbox");
  const now = parseNow(flags);
  const apply = flags.has("apply");
  const offline = flags.has("offline");
  if (apply && offline) throw new Error("--apply needs the database; remove --offline.");
  const minMatches = numberFlag(flags, "min-matches", 3);
  const runId = runIdFor(now);
  const outDir = typeof flags.get("out") === "string" ? String(flags.get("out")) : join("imports", "seeding-runs", runId);

  const client = offline ? null : getClient();
  const catalogue = client ? await loadCatalogue(client) : { opportunities: [] as Opportunity[], existing: [], orgNames: new Map<string, string>(), orgIdsByName: new Map<string, string>() };
  const raw = readCandidates(input);
  const result = runSeedingPipeline(raw, {
    now,
    existing: catalogue.existing,
    minLeadDays: numberFlag(flags, "min-lead-days", 14),
    allowAggregatorLinksForReview: flags.has("allow-aggregators-for-review"),
    includeEvidenceHoldsForReview: flags.has("include-evidence-held-for-review"),
  });

  // Coverage the catalogue would have if every accepted record were approved today.
  const projected = result.accepted.filter((accepted) => !accepted.reviewOnly).map((accepted) => candidateToOpportunity(accepted.candidate, { id: randomUUID(), organizationId: "projected", now, reviewerId: "projected", verificationStatus: "verified" }));
  const liveVisible = catalogue.opportunities.filter((opportunity) => visibilityFailures(opportunity, now).length === 0);
  const before = await computeCoverage(liveVisible, { now, minMatches });
  const after = await computeCoverage([...liveVisible, ...projected], { now, minMatches });

  ensureDir(outDir);
  writeJson(join(outDir, "accepted.json"), result.accepted);
  writeJson(join(outDir, "held.json"), result.held);
  writeJson(join(outDir, "report.json"), { runId, now: now.toISOString(), mode: apply ? "apply" : "dry-run", funnel: result.funnel, reviewOnly: result.accepted.filter((record) => record.reviewOnly).length, liveVisibleBefore: liveVisible.length, projectedVisibleAfter: liveVisible.length + projected.length, coverageBefore: before, coverageAfter: after });

  console.log(`${bar("=")}\nSeeding ${runId} (${apply ? "APPLY: staging as pending" : "dry run"})\n${bar("=")}`);
  console.log("Funnel (records remaining after each stage)");
  console.log(table(result.funnel.map((step) => [step.stage, step.remaining])));
  const byStage = new Map<string, HeldRecord[]>();
  for (const record of result.held) byStage.set(record.stage, [...(byStage.get(record.stage) ?? []), record]);
  if (result.held.length) console.log(`\nHeld: ${result.held.length}`);
  for (const [stage, records] of byStage) {
    console.log(`  [${stage}] ${records.length}`);
    for (const record of records.slice(0, 40)) console.log(`    - ${record.title}\n        ${record.reasons.join("; ")}`);
  }
  const warned = result.accepted.filter((record) => record.warnings.length);
  if (warned.length) {
    console.log("\nAccepted for review with warnings (these records remain hidden)");
    for (const record of warned) console.log(`  - ${record.candidate.title}: ${record.warnings.join("; ")}`);
  }
  console.log(offline
    ? `\nOffline: the live catalogue was not loaded. This run alone would add ${projected.length} visible record(s).`
    : `\nVisible to seekers now: ${liveVisible.length}. After approving this run: ${liveVisible.length + projected.length}.`);
  console.log("\nCoverage after this run (matches per typical seeker, at least 45 days left)");
  console.log(coverageLines(after));
  console.log(`\nFiles written to ${outDir}`);

  if (raw.length > 0 && result.accepted.length === 0) {
    console.error("\nFAILED: no record survived the gate. Fix the held reasons above; nothing was staged.");
    process.exitCode = 2;
    return;
  }
  if (flags.has("require-coverage") && after.some((row) => !row.meetsTarget)) {
    console.error(`\nFAILED: some seekers would have fewer than ${minMatches} matches (--require-coverage). Nothing was staged.`);
    process.exitCode = 3;
    return;
  }
  if (!apply) { console.log("\nDry run: nothing was written to the database. Re-run with --apply to stage."); return; }
  if (!client) return;
  await stage(client, runId, outDir, now, result.accepted, catalogue.orgIdsByName);
}

async function stage(client: ReturnType<typeof getClient>, runId: string, outDir: string, now: Date, accepted: AcceptedRecord[], orgIdsByName: Map<string, string>): Promise<void> {
  const journalPath = join(outDir, "applied.jsonl");
  if (existsSync(journalPath)) throw new Error(`${journalPath} exists: this run was already applied. Start a new run instead of re-applying.`);
  const needsColumn = accepted.some((record) => record.candidate.deadlineType === "rolling");
  const columnReady = await hasDeadlineTypeColumn(client);
  if (needsColumn && !columnReady) console.warn("\nThe DeadlineType migration has not been applied (npm run db:migrate). Rolling records are skipped until it is.");

  const staged: Array<{ id: string; action: string; title: string; sourceUrl: string; warnings: string[] }> = [];
  for (const record of accepted) {
    const { candidate } = record;
    if (candidate.deadlineType === "rolling" && !columnReady) continue;
    let organizationId = orgIdsByName.get(candidate.organizationName.trim().toLowerCase());
    if (!organizationId) {
      organizationId = randomUUID();
      const org: Row = { id: organizationId, name: candidate.organizationName, sector: "Opportunity provider", officialLinks: [`https://${candidate.organizationOfficialDomain}`], verificationStatus: "pending", dashboardUsers: [], postingHistory: [], accountableContacts: [], promotionPolicy: {}, updatedAt: now.toISOString() };
      const { error } = await client.from("Organization").insert(org);
      if (error) throw new Error(`Organization ${candidate.organizationName}: ${error.message}`);
      orgIdsByName.set(candidate.organizationName.trim().toLowerCase(), organizationId);
      journal(journalPath, { type: "organization-created", id: organizationId, name: candidate.organizationName });
    }
    const id = record.existingId ?? randomUUID();
    const built = candidateToOpportunity(candidate, { id, organizationId, now, reviewerId: `pipeline:${runId}`, verificationStatus: "pending" });
    const { organization: _organization, ...base } = built;
    void _organization;
    if (record.reviewOnly) {
      base.reviewChecklist = buildReviewChecklist({
        sourceAuthentic: false,
        officialApplicationLink: false,
        eligibleForUgandans: false,
        noInappropriateFees: false,
        noSensitiveDataAsk: false,
        deadlinePlausible: false,
        duplicateChecked: false,
      });
      base.reviewNotes = `${base.reviewNotes}\nStaged for manual review only. Complete verification and the review checklist before approval.`;
    }
    const row: Row = { ...base, deadline: built.deadline?.toISOString() ?? null, publicationDate: built.publicationDate.toISOString(), checkedAt: now.toISOString(), reviewedAt: null };
    if (!columnReady) delete row.deadlineType; else if (row.deadlineType === "fixed") delete row.deadlineType;

    if (record.action === "insert") {
      const { error } = await client.from("Opportunity").insert(row);
      if (error) throw new Error(`Insert ${candidate.title}: ${error.message}`);
      journal(journalPath, { type: "insert", id, title: candidate.title });
    } else {
      const { data: previous, error: readError } = await client.from("Opportunity").select("*").eq("id", id).single();
      if (readError) throw new Error(`Read ${id}: ${readError.message}`);
      if (record.action === "recheck") {
        const { error } = await client.from("Opportunity").update({ checkedAt: now.toISOString() }).eq("id", id);
        if (error) throw new Error(`Recheck ${id}: ${error.message}`);
      } else {
        const { id: _id, publicationDate: _publication, ...changes } = row;
        void _id; void _publication;
        const { error } = await client.from("Opportunity").update(changes).eq("id", id);
        if (error) throw new Error(`Update ${id}: ${error.message}`);
      }
      journal(journalPath, { type: record.action, id, title: candidate.title, previous });
    }
    staged.push({ id, action: record.action, title: candidate.title, sourceUrl: candidate.sourceUrl, warnings: record.warnings });
  }

  // Read back every record: a write that did not land must be loud.
  const { data: back, error } = await client.from("Opportunity").select("id,verificationStatus,checkedAt").in("id", staged.map((item) => item.id));
  if (error) throw new Error(`Read-back failed: ${error.message}`);
  if ((back?.length ?? 0) !== staged.length) throw new Error(`Read-back found ${back?.length ?? 0} of ${staged.length} staged records.`);
  writeJson(join(outDir, "staged.json"), staged);
  console.log(`\nStaged ${staged.length} record(s) as pending and verified by read-back.\nNext: review them, then  npm run seed:publish -- ${outDir} --reviewer "Your Name" [--apply]`);
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
