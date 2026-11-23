import { z } from "zod";

import type { Opportunity } from "@/core/entities/domain";
import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import type { OpportunityFilters, OpportunityInput } from "@/lib/repository/types";
import { memberOpportunitySchema, opportunitySchema, parseJson } from "@/lib/validation";
import { ingestManualOpportunity } from "@/services/ingestion/manual";
import { listOwnListings, submitMemberOpportunity } from "@/services/ingestion/member-submission";
import { publicOpportunity } from "@/services/trust/public-opportunity";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";

const listQuery = z.object({
  scope: z.enum(["catalog", "mine"]).optional(),
  category: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  workMode: z.enum(["remote", "onsite", "hybrid"]).optional(),
  search: z.string().trim().max(200).optional(),
  verificationStatus: z.enum(["unverified", "pending", "verified", "flagged"]).optional(),
  organizationId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

/**
 * GET /api/v1/opportunities
 * - Default: the verified, open catalogue, for anyone signed in. Moderation and poster fields are stripped.
 * - ?scope=mine: the listings you posted, in every review state.
 * - Admins get every listing and may filter by verificationStatus and organizationId.
 * Optional filters: category, location, workMode, search, limit (1 to 500).
 */
export async function GET(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const query = listQuery.parse(Object.fromEntries(new URL(request.url).searchParams));
    const repository = await getRepository();
    const now = new Date();
    if (query.scope === "mine") {
      const mine = (await listOwnListings(repository, auth)).slice(0, query.limit);
      return success(mine, 200, now);
    }
    const admin = auth.role === "admin";
    const filters: OpportunityFilters = {
      category: query.category,
      location: query.location,
      workMode: query.workMode,
      search: query.search,
      ...(admin
        ? { verificationStatus: query.verificationStatus, organizationId: query.organizationId }
        : { verificationStatus: "verified" as const, statuses: ["open", "closing_soon"] as Opportunity["status"][] }),
    };
    const rows = await repository.listOpportunities(filters);
    const visible = (admin ? rows : rows.filter((item) => isUserVisibleOpportunity(item, now))).slice(0, query.limit);
    const freshest = visible.reduce((date, item) => item.checkedAt > date ? item.checkedAt : date, new Date(0));
    return success(admin ? visible : visible.map(publicOpportunity), 200, freshest.getTime() ? freshest : now);
  });
}

/**
 * POST /api/v1/opportunities
 * Anyone signed in can post. It waits for a reviewer, who contacts the poster before approving it.
 * Admins can still add catalogue listings directly with the full listing schema.
 */
export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const repository = await getRepository();
    if (auth.role === "admin") {
      const input = await parseJson(request, opportunitySchema) as OpportunityInput;
      const created = await ingestManualOpportunity(repository, input);
      return success(created, 201, created.checkedAt);
    }
    const input = await parseJson(request, memberOpportunitySchema);
    const created = await submitMemberOpportunity(repository, auth.userId, input);
    return success(created, 201, created.checkedAt);
  });
}
