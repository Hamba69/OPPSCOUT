import { requireAdminPortalApi } from "@/lib/admin-portal";
import { z } from "zod";
import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";
import { AnthropicOpportunityExtractor } from "@/services/ai/anthropic-extractor";
import { getShadowValidationSnapshot } from "@/services/ingestion/scraping/metrics";
import { runShadowDiscovery } from "@/services/ingestion/scraping/pipeline";
import { getShadowOpportunityStore } from "@/services/ingestion/scraping/store";
const requestSchema = z.object({ sourceUrl: z.string().url(), organizationId: z.string().uuid() }).strict();
export async function GET(request: Request): Promise<Response> { return apiHandler(request, async () => { requireAdminPortalApi(request); return success(await getShadowValidationSnapshot(getShadowOpportunityStore())); }); }
export async function POST(request: Request): Promise<Response> { return apiHandler(request, async () => { requireAdminPortalApi(request); const input = await parseJson(request, requestSchema); const candidate = await runShadowDiscovery(input, await getRepository(), new AnthropicOpportunityExtractor(), getShadowOpportunityStore()); return success(candidate, 201); }); }
