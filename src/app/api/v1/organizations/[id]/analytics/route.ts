import { ForbiddenError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    if (auth.role === "organization" && auth.organizationId !== id) throw new ForbiddenError();
    const repository = await getRepository();
    const opportunityIds = new Set((await repository.listOpportunities({ organizationId: id })).map((item) => item.id));
    const events = (await repository.listEvents()).filter((event) => event.opportunityId && opportunityIds.has(event.opportunityId));
    const totals = { views: 0, saves: 0, clicks: 0, applyIntents: 0 };
    for (const event of events) {
      if (event.eventType === "view") totals.views += 1;
      if (event.eventType === "save") totals.saves += 1;
      if (event.eventType === "click") totals.clicks += 1;
      if (event.eventType === "apply_intent") totals.applyIntents += 1;
    }
    return success(totals);
  });
}
