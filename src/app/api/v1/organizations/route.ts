import { apiHandler, success } from "@/lib/api";
import { ForbiddenError } from "@/core/errors/app-error";
import { requireAuth, requireRole } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile-store";
import { getRepository } from "@/lib/repository";
import { organizationSchema, parseJson } from "@/lib/validation";

export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["user", "organization", "admin"]);
    // A brand-new organization account has the base role until its organization exists; job-seeker accounts (those with a profile) cannot be converted.
    if (auth.role === "user" && await getUserProfile(auth.userId)) throw new ForbiddenError();
    const input = await parseJson(request, organizationSchema);
    return success(await (await getRepository()).createOrganization({ ...input, dashboardUsers: [auth.userId] }), 201);
  });
}
