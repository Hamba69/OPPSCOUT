import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseJson, reportSchema } from "@/lib/validation";
import { reportSuspiciousListing } from "@/services/trust/report";

export async function POST(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const input = await parseJson(request, reportSchema);
    await reportSuspiciousListing(await getRepository(), auth.userId, input.opportunityId, input.reason, input.details);
    return success({ reported: true }, 201);
  });
}
