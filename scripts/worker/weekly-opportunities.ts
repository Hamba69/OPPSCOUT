import { FEATURE_FLAGS } from "@/config/feature-flags";
import { SCRAPING_RULES, SUPPORTED_SCRAPING_HOSTS } from "@/config/scraping-rules";
import { getRepository } from "@/lib/repository";
import { AnthropicOpportunityExtractor } from "@/services/ai/anthropic-extractor";
import { runPermittedSourceDiscovery } from "@/services/ingestion/scraping/discovery";
import { getShadowOpportunityStore } from "@/services/ingestion/scraping/store";
import { queueCandidatesForAdminReview } from "@/services/ingestion/scraping/review-queue";
import { refreshOpportunityLifecycle } from "@/services/ingestion/freshness";

async function main(): Promise<void> {
  const repository = await getRepository();
  const sweep = await refreshOpportunityLifecycle(repository);
  const store = getShadowOpportunityStore();
  const prunedShadowCandidates = await store.prune();
  console.log(JSON.stringify({ lifecycleSweep: sweep, prunedShadowCandidates }));

  const configuredHosts = [...new Set((process.env.OPPSCOUT_SCRAPER_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter((host): host is typeof SUPPORTED_SCRAPING_HOSTS[number] =>
      SUPPORTED_SCRAPING_HOSTS.includes(host as typeof SUPPORTED_SCRAPING_HOSTS[number])
    ))];
  if (!FEATURE_FLAGS.automatedScraping || configuredHosts.length === 0) {
    console.log(JSON.stringify({
      discovery: "skipped",
      reason: !FEATURE_FLAGS.automatedScraping ? "disabled" : "no approved hosts configured",
    }));
    return;
  }

  const extractor = new AnthropicOpportunityExtractor();
  const results: Array<{ host: string; discovery: Awaited<ReturnType<typeof runPermittedSourceDiscovery>>; reviewQueue: Awaited<ReturnType<typeof queueCandidatesForAdminReview>> }> = [];
  for (const host of configuredHosts) {
    const result = await runPermittedSourceDiscovery(
      {
        sourceUrl: `https://${host}/`,
        organizationId: null,
        startAt: 0,
        pageLimit: SCRAPING_RULES.maximumPagesPerRun,
      },
      repository,
      extractor,
      store,
    );
    const reviewQueue = await queueCandidatesForAdminReview(repository, result.candidates);
    results.push({ host, discovery: result, reviewQueue });
  }
  const prunedAfterDiscovery = await store.prune();
  console.log(JSON.stringify({ discovery: results, prunedAfterDiscovery }));
}

void main().catch((error: unknown) => {
  console.error("Weekly opportunity worker failed.", error);
  process.exitCode = 1;
});
