import { apiHandler, success } from "@/lib/api";
import { ForbiddenError } from "@/core/errors/app-error";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { organizationSchema, parseJson } from "@/lib/validation";

export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["user", "organization", "admin"]);
    if (auth.organizationId) throw new ForbiddenError();
    const input = await parseJson(request, organizationSchema);
    const [primary, secondary] = input.accountableContacts;
    return success(await (await getRepository()).createOrganization({
      ...input,
      accountableContact: primary.name,
      additionalAccountableContact: secondary?.name ?? null,
      additionalAccountableContactPhone: secondary?.phone ?? null,
      dashboardUsers: [auth.userId],
    }), 201);
  });
}
