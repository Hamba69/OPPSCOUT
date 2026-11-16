import { z } from "zod";

import { requireAdminPortalApi, requireSameOrigin } from "@/lib/admin-portal";
import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";
import { applyCatalogueFix, FIX_ACTIONS } from "@/services/admin/catalogue-fixes";

type Context = { params: Promise<{ id: string }> };

/** One-click catalogue repairs from Admin > Catalogue fixes. */
export async function POST(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    requireAdminPortalApi(request);
    requireSameOrigin(request);
    const { id } = await context.params;
    const input = await parseJson(request, z.object({ action: z.enum(FIX_ACTIONS) }).strict());
    const updated = await applyCatalogueFix(await getRepository(), id, input.action);
    return success({ id: updated.id, verificationStatus: updated.verificationStatus, status: updated.status, organizationId: updated.organizationId });
  });
}
