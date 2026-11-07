import { requireAdminPortalApi } from "@/lib/admin-portal";
import { z } from "zod";
import { AppError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";
import { FEATURE_FLAGS } from "@/config/feature-flags";
import { AnthropicOpportunityExtractor } from "@/services/ai/anthropic-extractor";
import { getShadowValidationSnapshot } from "@/services/ingestion/scraping/metrics";
import { runPermittedSourceDiscovery } from "@/services/ingestion/scraping/discovery";
import { getShadowOpportunityStore } from "@/services/ingestion/scraping/store";
import { SCRAPING_RULES, SUPPORTED_SCRAPING_HOSTS } from "@/config/scraping-rules";
const requestSchema = z.object({
  sourceUrl: z.string().url().refine((value) => new URL(value).protocol === "https:", "Source URLs must use HTTPS."),
  organizationId: z.string().uuid().nullable().default(null),
  startAt: z.number().int().min(0).default(0),
  pageLimit: z.number().int().min(1).max(SCRAPING_RULES.maximumPagesPerRun).default(SCRAPING_RULES.maximumPagesPerRun),
}).strict();
export async function GET(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    requireAdminPortalApi(request);
    const store = getShadowOpportunityStore();
    const [metrics, candidates] = await Promise.all([getShadowValidationSnapshot(store), store.list()]);
    const configuredHosts = (process.env.OPPSCOUT_SCRAPER_ALLOWED_HOSTS ?? "").split(",").map((host) => host.trim().toLowerCase()).filter((host) => SUPPORTED_SCRAPING_HOSTS.includes(host as typeof SUPPORTED_SCRAPING_HOSTS[number]));
    const recentCandidates = [...candidates].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)).slice(0, 100);
    return success({ metrics, candidates: recentCandidates, configuredHosts, enabled: FEATURE_FLAGS.automatedScraping, maximumPagesPerRun: SCRAPING_RULES.maximumPagesPerRun });
  });
}
export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    requireAdminPortalApi(request);
    const input = await parseJson(request, requestSchema);
    if (!FEATURE_FLAGS.automatedScraping) {
      throw new AppError("Source discovery is disabled until permission is confirmed and the feature is enabled.", 503, "SCRAPING_DISABLED");
    }
    const result = await runPermittedSourceDiscovery(
      input,
      await getRepository(),
      new AnthropicOpportunityExtractor(),
      getShadowOpportunityStore(),
    );
    return success(result, 201);
  });
}
