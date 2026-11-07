import { createHash } from "node:crypto";
import { SCRAPING_RULES } from "@/config/scraping-rules";
import { AppError } from "@/core/errors/app-error";
import { isPublicHttpsUrl } from "@/lib/validation";
import type { Repository } from "@/lib/repository/types";
import type { OpportunityTextExtractor } from "@/services/ai/types";
import type { ShadowCandidate, ShadowOpportunityStore } from "@/services/ingestion/scraping/types";
import { assessAutomatedTrust } from "@/services/trust/automated-signals";

function pageContent(html: string, pageUrl: URL): { text: string; links: Set<string> } {
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(([, href, label]) => {
      const target = new URL(href.replace(/&amp;/g, "&"), pageUrl).toString();
      return { url: target, text: `${label?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}: ${target}` };
    })
    .filter((link) => link.text.length > 2);
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return { text: `${text}\n\nPage links:\n${links.map((link) => link.text).join("\n")}`, links: new Set(links.map((link) => link.url)) };
}
export async function runShadowDiscovery(input: { sourceUrl: string; organizationId: string | null }, repository: Repository, extractor: OpportunityTextExtractor, store: ShadowOpportunityStore, fetcher: typeof fetch = fetch, now = new Date()): Promise<ShadowCandidate> {
  const url = new URL(input.sourceUrl); if (url.protocol !== "https:") throw new AppError("Scraping sources must use HTTPS.", 422, "INVALID_SOURCE");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), SCRAPING_RULES.requestTimeoutMs);
  try {
    const response = await fetcher(url, { signal: controller.signal, headers: { "user-agent": "OppScoutBot/1.0 (+data-quality-shadow-mode)" } }); if (!response.ok) throw new AppError(`Source returned ${response.status}.`, 502, "SCRAPE_SOURCE_ERROR");
    const html = (await response.text()).slice(0, SCRAPING_RULES.maximumDocumentBytes);
    const content = pageContent(html, url);
    const extracted = await extractor.extract(url.toString(), content.text);
    if (!extracted.isOpportunity) throw new AppError("The page does not contain an active opportunity listing.", 422, "NOT_AN_OPPORTUNITY");
    const deadline = extracted.deadline === null ? null : new Date(extracted.deadline);
    if (deadline && !Number.isFinite(deadline.getTime())) throw new AppError("The extracted closing date is invalid.", 422, "INVALID_DEADLINE");
    let applicationUrl: string | null = null;
    if (extracted.applicationUrl) {
      const candidateUrl = new URL(extracted.applicationUrl, url).toString();
      if (content.links.has(candidateUrl) && isPublicHttpsUrl(candidateUrl)) applicationUrl = candidateUrl;
    }
    const liveInput = { ...extracted, organizationId: input.organizationId, deadline, sourceUrl: applicationUrl ?? url.toString(), source: "scraped" as const, verificationStatus: "unverified" as const, status: "open" as const };
    const trust = await assessAutomatedTrust(repository, liveInput);
    if (!applicationUrl) trust.signals.push("No explicit official application link was found; verify it manually.");
    const candidate: ShadowCandidate = { id: createHash("sha256").update(url.toString()).digest("hex"), sourceUrl: url.toString(), applicationUrl, sourceHost: url.hostname, capturedAt: now.toISOString(), input: { ...liveInput, deadline: deadline?.toISOString() ?? null }, duplicateOpportunityId: trust.duplicateOpportunityId, freshnessError: deadline !== null && deadline.getTime() <= now.getTime(), trustSignals: trust.signals };
    await store.put(candidate); return candidate;
  } finally { clearTimeout(timeout); }
}
