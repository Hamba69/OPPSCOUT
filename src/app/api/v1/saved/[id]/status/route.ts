import { z } from "zod";

import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";
import { recordEvent } from "@/services/kpi/events";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const { id } = await context.params;
    const input = await parseJson(request, z.object({ status: z.enum(["saved", "applied", "expired"]) }).strict());
    const repository = await getRepository();
    const saved = await repository.updateSaved(auth.userId, id, input.status);
    if (input.status === "applied") await recordEvent(repository, "apply_intent", auth.userId, saved.opportunityId);
    return success(saved);
  });
}
