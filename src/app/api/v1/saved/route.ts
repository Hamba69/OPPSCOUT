import { z } from "zod";

import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";
import { recordEvent } from "@/services/kpi/events";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    return success(await (await getRepository()).listSaved(auth.userId));
  });
}

export async function POST(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const input = await parseJson(request, z.object({ opportunityId: z.string().uuid() }).strict());
    const repository = await getRepository();
    const saved = await repository.saveOpportunity(auth.userId, input.opportunityId);
    await recordEvent(repository, "save", auth.userId, input.opportunityId);
    return success(saved, 201);
  });
}
