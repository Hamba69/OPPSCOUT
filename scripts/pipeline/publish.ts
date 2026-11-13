/**
 * Seeding pipeline, stage 4: a person approves staged records. Dry run by default.
 *
 *   npm run seed:publish -- <run-folder> --reviewer "Your Name" [--ids a,b,c] [--apply]
 *
 * Each record is re-checked against the same visibility gate the app uses, so a record that would
 * still be invisible after approval is refused here instead of silently showing nothing to users.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { visibilityFailures } from "../../src/services/trust/user-publication-policy";
import { bar, getClient, journal, parseArgs, parseNow, rowToOpportunity, type Row } from "./lib";

const { positional, flags } = parseArgs(process.argv.slice(2));

async function main(): Promise<void> {
  const runDir = positional[0];
  const reviewer = flags.get("reviewer");
  if (!runDir) throw new Error('Usage: npm run seed:publish -- <run-folder> --reviewer "Name" [--ids a,b] [--apply]');
  if (typeof reviewer !== "string" || reviewer.trim().length < 2) throw new Error("--reviewer is required: a named person approves, not the pipeline.");
  const stagedPath = join(runDir, "staged.json");
  if (!existsSync(stagedPath)) throw new Error(`${stagedPath} not found. Run seed:run with --apply first.`);
  const staged = JSON.parse(readFileSync(stagedPath, "utf8")) as Array<{ id: string; action: string; title: string; sourceUrl: string; warnings: string[] }>;
  const only = typeof flags.get("ids") === "string" ? new Set(String(flags.get("ids")).split(",").map((id) => id.trim())) : null;
  const wanted = staged.filter((item) => !only || only.has(item.id));
  const now = parseNow(flags);
  const apply = flags.has("apply");

  const client = getClient();
  const { data, error } = await client.from("Opportunity").select("*").in("id", wanted.map((item) => item.id));
  if (error) throw new Error(error.message);
  const rows = new Map((data as Row[]).map((row) => [String(row.id), row]));

  console.log(`${bar("=")}\nApproval for ${runDir} by ${reviewer} (${apply ? "APPLY" : "dry run"})\n${bar("=")}`);
  const approvable: string[] = [];
  for (const item of wanted) {
    const row = rows.get(item.id);
    if (!row) { console.log(`  MISSING  ${item.title} (${item.id})`); continue; }
    if (row.verificationStatus === "verified") { console.log(`  already  ${item.title}`); continue; }
    const projected = { ...rowToOpportunity(row), verificationStatus: "verified" as const, reviewedAt: now, reviewerId: reviewer };
    const failures = visibilityFailures(projected, now);
    if (failures.length) { console.log(`  REFUSED  ${item.title}\n           ${failures.join("; ")}`); continue; }
    approvable.push(item.id);
    console.log(`  ok       ${item.title}\n           closes ${projected.deadline?.toISOString().slice(0, 16) ?? "rolling"} | ${item.sourceUrl}${item.warnings.length ? `\n           check: ${item.warnings.join("; ")}` : ""}`);
  }
  console.log(`\n${approvable.length} record(s) can be approved.`);
  if (!apply) { console.log("Dry run: nothing changed. Open each source link, then re-run with --apply."); return; }

  const journalPath = join(runDir, "published.jsonl");
  for (const id of approvable) {
    const row = rows.get(id)!;
    const notes = `${String(row.reviewNotes ?? "")}\nApproved by ${reviewer} on ${now.toISOString().slice(0, 10)} after checking the official source.`.trim();
    const { data: updated, error: updateError } = await client.from("Opportunity")
      .update({ verificationStatus: "verified", reviewedAt: now.toISOString(), reviewerId: reviewer, reviewNotes: notes })
      .eq("id", id).eq("verificationStatus", row.verificationStatus as string).select("id");
    if (updateError) throw new Error(`Approve ${id}: ${updateError.message}`);
    if (!updated?.length) throw new Error(`Approve ${id}: the record changed since it was read; re-run.`);
    journal(journalPath, { id, reviewer, at: now.toISOString(), previous: { verificationStatus: row.verificationStatus, reviewedAt: row.reviewedAt, reviewerId: row.reviewerId } });
  }

  const { data: back, error: backError } = await client.from("Opportunity").select("*").in("id", approvable);
  if (backError) throw new Error(backError.message);
  const visible = (back as Row[]).map(rowToOpportunity).filter((opportunity) => visibilityFailures(opportunity, now).length === 0);
  console.log(`Approved ${approvable.length}. Read-back: ${visible.length} of them are now visible to seekers.`);
  if (visible.length !== approvable.length) { console.error("MISMATCH: some approved records are still invisible."); process.exitCode = 2; }
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
