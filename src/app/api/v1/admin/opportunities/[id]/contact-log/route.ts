import { z } from "zod";

import { requireAdminPortalApi, requireSameOrigin } from "@/lib/admin-portal";
import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";
import { CONTACT_METHODS, contactLogLines, logPosterContact } from "@/services/trust/poster-contact";

type Context = { params: Promise<{ id: string }> };

/** Admin > Review: note that the poster was contacted and what they confirmed. */
export async function POST(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    requireAdminPortalApi(request);
    requireSameOrigin(request);
    const { id } = await context.params;
    const input = await parseJson(request, z.object({ method: z.enum(CONTACT_METHODS), note: z.string().trim().min(3, "Say what the poster confirmed.").max(500) }).strict());
    const updated = await logPosterContact(await getRepository(), id, input.method, input.note);
    return success({ id: updated.id, contactLog: contactLogLines(updated.reviewNotes) });
  });
}
