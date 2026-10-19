import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import type { ShadowOpportunityInput } from "@/services/ingestion/scraping/types";
import { parseScan, type Lead } from "./import-uganda-scan";

loadEnvConfig(process.cwd());

// One-time AI discovery run: each unique lead URL goes through the real shadow pipeline
// (fetch -> Anthropic extraction -> trust/dedup/freshness -> shadow store). Candidates that
// pass are inserted as pending catalog rows, never verified. Dry-run unless --apply is passed.
const scanDate = "2026-10-16";
const scanPath = "D:\\PROBOOK\\finwa\\OppScout_Uganda_Opportunity_Scan_2026-10-16.md";
const reportPath = "imports/ai-discovery-run-2026-10-16/run_report.json";
const apply = process.argv.includes("--apply");
const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
const limit = limitArgument ? Number(limitArgument.split("=")[1]) : Number.POSITIVE_INFINITY;
const concurrency = 4;

type Outcome = {
  sourceUrl: string;
  leadIds: string[];
  status: "candidate" | "error";
  error?: string;
  candidateId?: string;
  input?: ShadowOpportunityInput;
  duplicateOpportunityId?: string | null;
  freshnessError?: boolean;
  trustSignals?: string[];
  risk?: "clean" | "review" | "sensitive";
  insert?: "inserted" | "skipped_duplicate_of_existing" | "skipped_expired" | "skipped_same_source" | "skipped_within_run_duplicate";
};

function statusFor(deadline: Date | null): "open" | "closing_soon" | "closed" {
  if (!deadline) return "open";
  const now = new Date(`${scanDate}T23:59:59+03:00`);
  if (deadline < new Date(`${scanDate}T00:00:00+03:00`)) return "closed";
  return deadline.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000 ? "closing_soon" : "open";
}

async function mapWithConcurrency<T, R>(items: T[], size: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }));
  return results;
}

async function main(): Promise<void> {
  // Imported lazily so env is loaded before the config modules read process.env.
  const { getRepository } = await import("@/lib/repository");
  const { AnthropicOpportunityExtractor } = await import("@/services/ai/anthropic-extractor");
  const { runShadowDiscovery } = await import("@/services/ingestion/scraping/pipeline");
  const { getShadowOpportunityStore } = await import("@/services/ingestion/scraping/store");

  const leads: Lead[] = parseScan(readFileSync(scanPath, "utf8"));
  const leadsByUrl = new Map<string, Lead[]>();
  for (const lead of leads) leadsByUrl.set(lead.sourceUrl, [...(leadsByUrl.get(lead.sourceUrl) ?? []), lead]);
  const urls = [...leadsByUrl.keys()].filter((url) => url.startsWith("https://")).slice(0, limit);
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", leads: leads.length, uniqueHttpsUrls: urls.length }));

  const repository = await getRepository();
  const store = getShadowOpportunityStore();
  const extractor = new AnthropicOpportunityExtractor();

  // Unlinked catalog rows have no Organization FK, so the pipeline runs with a null organization.
  const shadowRuns = await mapWithConcurrency(urls, concurrency, async (sourceUrl): Promise<Outcome> => {
    const leadIds = (leadsByUrl.get(sourceUrl) ?? []).map((lead) => lead.id);
    try {
      const candidate = await runShadowDiscovery({ sourceUrl, organizationId: null as unknown as string }, repository, extractor, store);
      return {
        sourceUrl,
        leadIds,
        status: "candidate",
        candidateId: candidate.id,
        input: candidate.input,
        duplicateOpportunityId: candidate.duplicateOpportunityId,
        freshnessError: candidate.freshnessError,
        trustSignals: candidate.trustSignals,
        risk: candidate.trustSignals.some((signal) => signal.includes("payment") || signal.includes("sensitive")) ? "sensitive" : candidate.trustSignals.length ? "review" : "clean",
      };
    } catch (error) {
      return { sourceUrl, leadIds, status: "error", error: error instanceof Error ? error.message : String(error) };
    }
  });

  const existing = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existingRows, error: existingError } = await existing.from("Opportunity").select("sourceUrl,title");
  if (existingError) throw new Error(existingError.message);
  const existingSourceUrls = new Set((existingRows ?? []).map((row) => row.sourceUrl));

  const timestamp = new Date(`${scanDate}T00:00:00+03:00`).toISOString();
  const rowsToInsert: Record<string, unknown>[] = [];
  const insertedKeys = new Set<string>();
  for (const outcome of shadowRuns) {
    if (outcome.status !== "candidate" || !outcome.candidateId) continue;
    const input = outcome.input;
    if (!input) continue;
    const titleKey = input.title.trim().toLowerCase();
    if (outcome.duplicateOpportunityId) outcome.insert = "skipped_duplicate_of_existing";
    else if (outcome.freshnessError) outcome.insert = "skipped_expired";
    else if (existingSourceUrls.has(outcome.sourceUrl)) outcome.insert = "skipped_same_source";
    else if (insertedKeys.has(`${titleKey}|${outcome.sourceUrl}`)) outcome.insert = "skipped_within_run_duplicate";
    else {
      outcome.insert = "inserted";
      insertedKeys.add(`${titleKey}|${outcome.sourceUrl}`);
      const lead = leadsByUrl.get(outcome.sourceUrl)?.[0];
      const flagged = outcome.risk === "sensitive";
      rowsToInsert.push({
        id: randomUUID(),
        title: input.title,
        organizationId: null,
        organizationName: lead?.organization ?? null,
        category: input.category,
        description: input.description,
        eligibility: input.eligibility,
        requiredSkills: input.requiredSkills,
        preferredSkills: input.preferredSkills,
        location: input.location,
        workMode: input.workMode,
        deadline: input.deadline,
        applicationMethod: input.applicationMethod,
        sourceUrl: input.sourceUrl,
        verificationStatus: flagged ? "flagged" : "pending",
        source: "scraped",
        origin: "catalog",
        publicationDate: timestamp,
        checkedAt: timestamp,
        status: statusFor(input.deadline ? new Date(input.deadline) : null),
        reviewChecklist: { sourceAuthentic: false, noInappropriateFees: false, noSensitiveDataAsk: false, deadlinePlausible: input.deadline !== null, duplicateChecked: true },
        reviewNotes: `AI discovery run ${scanDate} (candidate ${outcome.candidateId}) from Uganda Opportunity Scan lead(s) ${outcome.leadIds.join(", ")}. Trust signals: ${outcome.trustSignals?.join(" ") || "none"}. The source is an aggregator-discovered lead; trace to the official employer or funder before approval.`,
      });
    }
  }

  const summary = {
    mode: apply ? "apply" : "dry-run",
    urlsRun: shadowRuns.length,
    candidates: shadowRuns.filter((outcome) => outcome.status === "candidate").length,
    errors: shadowRuns.filter((outcome) => outcome.status === "error").length,
    inserts: rowsToInsert.length,
    skipped: shadowRuns.reduce<Record<string, number>>((counts, outcome) => {
      if (outcome.insert && outcome.insert !== "inserted") counts[outcome.insert] = (counts[outcome.insert] ?? 0) + 1;
      return counts;
    }, {}),
  };

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify({ runAt: new Date().toISOString(), summary, outcomes: shadowRuns }, null, 2), "utf8");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Report written to ${reportPath}`);

  if (!apply || rowsToInsert.length === 0) return;
  const response = await existing.from("Opportunity").insert(rowsToInsert);
  if (response.error) throw new Error(`Opportunity insert: ${response.error.message}`);
  console.log(`Inserted ${rowsToInsert.length} pending/flagged AI-discovered opportunities.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "AI discovery run failed.");
  process.exitCode = 1;
});
