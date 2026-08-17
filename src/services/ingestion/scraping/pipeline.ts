import { randomUUID } from "node:crypto";
import { SCRAPING_RULES } from "@/config/scraping-rules";
import { AppError } from "@/core/errors/app-error";
import type { Repository } from "@/lib/repository/types";
import type { OpportunityTextExtractor } from "@/services/ai/types";
import type { ShadowCandidate, ShadowOpportunityStore } from "@/services/ingestion/scraping/types";
import { assessAutomatedTrust } from "@/services/trust/automated-signals";

function plainText(html: string): string { return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
export async function runShadowDiscovery(input: { sourceUrl: string; organizationId: string }, repository: Repository, extractor: OpportunityTextExtractor, store: ShadowOpportunityStore, fetcher: typeof fetch = fetch, now = new Date()): Promise<ShadowCandidate> {
  const url = new URL(input.sourceUrl); if (url.protocol !== "https:") throw new AppError("Scraping sources must use HTTPS.", 422, "INVALID_SOURCE");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), SCRAPING_RULES.requestTimeoutMs);
  try {
    const response = await fetcher(url, { signal: controller.signal, headers: { "user-agent": "OppScoutBot/1.0 (+data-quality-shadow-mode)" } }); if (!response.ok) throw new AppError(`Source returned ${response.status}.`, 502, "SCRAPE_SOURCE_ERROR");
    const html = (await response.text()).slice(0, SCRAPING_RULES.maximumDocumentBytes); const extracted = await extractor.extract(url.toString(), plainText(html));
    const liveInput = { ...extracted, organizationId: input.organizationId, deadline: new Date(extracted.deadline), sourceUrl: url.toString(), source: "scraped" as const, verificationStatus: "unverified" as const, status: "open" as const };
    const trust = await assessAutomatedTrust(repository, liveInput); const deadline = liveInput.deadline;
    const candidate: ShadowCandidate = { id: randomUUID(), sourceUrl: url.toString(), capturedAt: now.toISOString(), input: { ...liveInput, deadline: deadline.toISOString() }, duplicateOpportunityId: trust.duplicateOpportunityId, freshnessError: deadline.getTime() <= now.getTime(), trustSignals: trust.signals };
    await store.put(candidate); return candidate;
  } finally { clearTimeout(timeout); }
}
