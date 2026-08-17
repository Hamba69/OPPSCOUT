import { z } from "zod";

import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseJson, trustChecklistSchema } from "@/lib/validation";
import { reviewOpportunity } from "@/services/trust/review";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["admin"]);
    const { id } = await context.params;
    const input = await parseJson(request, z.object({ checklist: trustChecklistSchema, approved: z.boolean(), notes: z.string().trim().max(2_000).optional() }).strict());
    return success(await reviewOpportunity(await getRepository(), id, auth.userId, input.checklist, input.approved, input.notes));
  });
}
