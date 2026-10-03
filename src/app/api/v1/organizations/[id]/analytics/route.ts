import { ForbiddenError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    if (auth.role === "organization" && auth.organizationId !== id) throw new ForbiddenError();
    const repository = await getRepository();
    const days = Math.min(90, Math.max(7, Number(new URL(request.url).searchParams.get("days") ?? 30)));
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const opportunityIds = (await repository.listOpportunities({ organizationId: id, origin: "organization" })).map((item) => item.id);
    const count = async (eventType: string): Promise<number> => {
      if (!opportunityIds.length) return 0;
      const events = await repository.listEvents({ eventType: eventType as "view" | "save" | "click" | "apply_intent", since: new Date(since) });
      return events.filter((event) => event.opportunityId && opportunityIds.includes(event.opportunityId)).length;
    };
    const [views, saves, clicks, applyIntents] = await Promise.all(["view", "save", "click", "apply_intent"].map(count));
    const totals = { views, saves, clicks, applyIntents, days };
    return success(totals);
  });
}
