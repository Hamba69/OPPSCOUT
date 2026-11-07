import { z } from "zod";

import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";
import { recordEvent } from "@/services/kpi/events";
import { ForbiddenError } from "@/core/errors/app-error";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const repository = await getRepository();
    const saved = await repository.listSaved(auth.userId);
    const opportunities = await repository.listOpportunities({ opportunityIds: saved.map((item) => item.opportunityId) });
    const visibleIds = new Set(opportunities.filter((item) => isUserVisibleOpportunity(item)).map((item) => item.id));
    return success(saved.filter((item) => visibleIds.has(item.opportunityId)));
  });
}

export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const input = await parseJson(request, z.object({ opportunityId: z.string().uuid() }).strict());
    const repository = await getRepository();
    const opportunity = await repository.getOpportunity(input.opportunityId);
    if (!opportunity || !isUserVisibleOpportunity(opportunity)) {
      throw new ForbiddenError("Only verified opportunities that meet the publication requirements can be saved.");
    }
    const saved = await repository.saveOpportunity(auth.userId, input.opportunityId);
    await recordEvent(repository, "save", auth.userId, input.opportunityId);
    return success(saved, 201);
  });
}
