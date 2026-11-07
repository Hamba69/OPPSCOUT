import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import type { OpportunityFilters, OpportunityInput } from "@/lib/repository/types";
import { ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import { submitOrganizationOpportunity } from "@/services/ingestion/org-submission";
import { ingestManualOpportunity } from "@/services/ingestion/manual";
import { opportunitySchema, parseJson } from "@/lib/validation";
import { publisherCanPost } from "@/lib/publisher-verification";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";
import { buildRankedFeed } from "@/services/matching/feed";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
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
      origin: auth.role === "organization" ? "organization" : undefined,
    };
    const repository = await getRepository();
    const rows = await repository.listOpportunities(filters);
    const now = new Date();
    let opportunities = rows;
    if (auth.role === "user") {
      const verified = rows.filter((item) => isUserVisibleOpportunity(item, now));
      const matches = await buildRankedFeed(repository, auth.userId, now, undefined, {
        persist: false,
        telemetry: false,
        opportunities: verified,
      });
      const relevantIds = new Set(matches.map((match) => match.opportunityId));
      opportunities = verified.filter((item) => relevantIds.has(item.id));
    }
    const freshest = opportunities.reduce((date, item) => item.checkedAt > date ? item.checkedAt : date, new Date(0));
    return success(opportunities, 200, freshest.getTime() ? freshest : new Date());
  });
}

export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const input = await parseJson(request, opportunitySchema) as OpportunityInput;
    const repository = await getRepository();
    if (auth.role === "organization") {
      if (!auth.organizationId) throw new ForbiddenError();
      const organization = await repository.getOrganization(auth.organizationId);
      if (!organization) throw new NotFoundError("Organization");
      if (!await publisherCanPost(organization)) {
        throw new ForbiddenError("Publisher verification, including official contact details and URSB proof, is required before posting opportunities.");
      }
    }
    const opportunity = auth.role === "organization"
      ? await submitOrganizationOpportunity(repository, auth.userId, input)
      : await ingestManualOpportunity(repository, input);
    return success(opportunity, 201, opportunity.checkedAt);
  });
}
