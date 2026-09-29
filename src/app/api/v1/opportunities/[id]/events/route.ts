import { z } from "zod";

import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const { id } = await context.params;
    const input = await parseJson(request, z.object({ eventType: z.enum(["view", "click", "apply_intent"]) }).strict());
    const event = await (await getRepository()).writeEvent({ eventType: input.eventType, userId: auth.userId, opportunityId: id });
    return success(event, 201);
  });
}
