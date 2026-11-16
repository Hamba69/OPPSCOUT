/**
 * Put back approvals that a later seeding run removed. Dry run by default.
 *
 *   npx tsx scripts/pipeline/restore-approvals.ts <run-folder> [<run-folder> ...] [--apply]
 *
 * Reads each run's applied.jsonl. For every "update-changed" entry whose row was APPROVED and live
 * before that run, and is now pending, it restores the approval fields from the journal
 * (verificationStatus, reviewedAt, reviewerId, reviewNotes, reviewChecklist, status), keeping the
 * newer content. Rows whose deadline changed in that run are only listed, not restored: a person
 * should approve the new deadline in /admin/review.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { getClient, journal, parseArgs, type Row } from "./lib";

const { positional, flags } = parseArgs(process.argv.slice(2));
const APPROVAL_FIELDS = ["verificationStatus", "reviewedAt", "reviewerId", "reviewNotes", "reviewChecklist", "status"] as const;

async function main(): Promise<void> {
  if (!positional.length) throw new Error("Usage: npx tsx scripts/pipeline/restore-approvals.ts <run-folder> [...] [--apply]");
  const apply = flags.has("apply");
  const candidates = new Map<string, { title: string; previous: Row; runDir: string }>();
  for (const runDir of positional) {
    const path = join(runDir, "applied.jsonl");
    if (!existsSync(path)) { console.warn(`skip ${runDir}: no applied.jsonl`); continue; }
    for (const line of readFileSync(path, "utf8").split("\n").filter((l) => l.trim())) {
      const entry = JSON.parse(line) as { type: string; id: string; title?: string; previous?: Row };
      if (entry.type !== "update-changed" || !entry.previous) continue;
      const prev = entry.previous;
      if (prev.verificationStatus !== "verified" || !["open", "closing_soon"].includes(String(prev.status))) continue;
      if (!candidates.has(entry.id)) candidates.set(entry.id, { title: entry.title ?? entry.id, previous: prev, runDir });
    }
  }
  if (!candidates.size) { console.log("Nothing to restore: no approved listing was demoted by these runs."); return; }

  const client = getClient();
  const { data, error } = await client.from("Opportunity").select("id,title,verificationStatus,deadline,status").in("id", [...candidates.keys()]);
  if (error) throw new Error(error.message);
  let restored = 0, review = 0, skipped = 0;
  for (const row of data ?? []) {
    const c = candidates.get(row.id as string)!;
    if (row.verificationStatus === "verified") { skipped += 1; continue; }
    const before = c.previous.deadline ? Date.parse(String(c.previous.deadline)) : null;
    const now = row.deadline ? Date.parse(String(row.deadline)) : null;
    if (before !== now) {
      review += 1;
      console.log(`  NEEDS REVIEW (deadline changed ${c.previous.deadline ?? "rolling"} -> ${row.deadline ?? "rolling"}): ${row.title} (${row.id})`);
      continue;
    }
    console.log(`  ${apply ? "restored" : "would restore"}  ${row.title} (${row.id})`);
    if (!apply) { restored += 1; continue; }
    const patch: Row = {};
    for (const field of APPROVAL_FIELDS) patch[field] = c.previous[field] ?? null;
    const { error: updateError } = await client.from("Opportunity").update(patch).eq("id", row.id as string).neq("verificationStatus", "verified");
    if (updateError) { console.error(`  FAILED ${row.id}: ${updateError.message}`); continue; }
    journal(join(c.runDir, "approvals-restored.jsonl"), { id: row.id, at: new Date().toISOString(), restored: patch });
    restored += 1;
  }
  console.log(`\n${apply ? "Restored" : "Would restore"} ${restored}; ${review} need review (deadline changed); ${skipped} already approved again.`);
  if (!apply) console.log("Dry run: nothing changed. Re-run with --apply.");
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
