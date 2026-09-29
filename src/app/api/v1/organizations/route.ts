import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { organizationSchema, parseJson } from "@/lib/validation";

export async function POST(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const input = await parseJson(request, organizationSchema);
    return success(await (await getRepository()).createOrganization({ ...input, dashboardUsers: [auth.userId] }), 201);
  });
}
