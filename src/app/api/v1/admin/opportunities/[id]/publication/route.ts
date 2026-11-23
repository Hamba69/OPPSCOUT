import { z } from "zod";

import { requireAdminPortalApi, requireSameOrigin } from "@/lib/admin-portal";
import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";
import { readmitOpportunity, withdrawOpportunity } from "@/services/trust/publication";
import { notifyPoster } from "@/services/notifications/poster-updates";

type Context = { params: Promise<{ id: string }> };

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("withdraw"), reason: z.string().trim().min(3).max(500) }).strict(),
  z.object({ action: z.literal("readmit"), confirmed: z.literal(true), note: z.string().trim().max(500).optional() }).strict(),
]);

/** Admin > Review: withdraw a verified listing, or re-admit a flagged or removed one. */
export async function POST(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    requireAdminPortalApi(request);
    requireSameOrigin(request);
    const { id } = await context.params;
    const input = await parseJson(request, schema);
    const repository = await getRepository();
    const updated = input.action === "withdraw"
      ? await withdrawOpportunity(repository, id, "admin-portal", input.reason)
      : await readmitOpportunity(repository, id, "admin-portal", input.note);
    const notice = await notifyPoster(repository, updated, input.action === "withdraw" ? "withdrawn" : "readmitted", input.action === "withdraw" ? input.reason : input.note);
    return success({ id: updated.id, verificationStatus: updated.verificationStatus, status: updated.status, posterEmailed: notice.emailed });
  });
}
