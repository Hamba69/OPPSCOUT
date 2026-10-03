import { requireAdminPortalApi } from "@/lib/admin-portal";
import { z } from "zod";

import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
const reviewSchema = z.object({ approved: z.boolean() }).strict();

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    requireAdminPortalApi(request);
    const { id } = await context.params;
    const { approved } = await parseJson(request, reviewSchema);
    return success(await (await getRepository()).reviewOrganization(id, approved));
  });
}
