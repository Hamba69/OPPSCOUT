import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { organizationSchema, parseJson } from "@/lib/validation";

export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const input = await parseJson(request, organizationSchema);
    return success(await (await getRepository()).createOrganization({ ...input, dashboardUsers: [auth.userId] }), 201);
  });
}
