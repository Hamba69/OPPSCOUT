import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import type { OpportunityFilters, OpportunityInput } from "@/lib/repository/types";
import { submitOrganizationOpportunity } from "@/services/ingestion/org-submission";
import { ingestManualOpportunity } from "@/services/ingestion/manual";
import { opportunitySchema, parseJson } from "@/lib/validation";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const url = new URL(request.url);
    const filters: OpportunityFilters = {
      category: url.searchParams.get("category") ?? undefined,
      location: url.searchParams.get("location") ?? undefined,
      workMode: (url.searchParams.get("workMode") as OpportunityFilters["workMode"]) ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      verificationStatus: auth.role === "user" ? "verified" : (url.searchParams.get("verificationStatus") as OpportunityFilters["verificationStatus"]) ?? undefined,
      statuses: auth.role === "user" ? ["open", "closing_soon"] : undefined,
      organizationId: auth.role === "organization" ? auth.organizationId ?? undefined : url.searchParams.get("organizationId") ?? undefined,
    };
    const opportunities = await (await getRepository()).listOpportunities(filters);
    const freshest = opportunities.reduce((date, item) => item.checkedAt > date ? item.checkedAt : date, new Date(0));
    return success(opportunities, 200, freshest.getTime() ? freshest : new Date());
  });
}

export async function POST(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const input = await parseJson(request, opportunitySchema) as OpportunityInput;
    const repository = await getRepository();
    const opportunity = auth.role === "organization"
      ? await submitOrganizationOpportunity(repository, auth.userId, input)
      : await ingestManualOpportunity(repository, input);
    return success(opportunity, 201, opportunity.checkedAt);
  });
}
