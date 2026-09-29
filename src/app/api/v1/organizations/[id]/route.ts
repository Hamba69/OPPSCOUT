import { ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { organizationSchema, parseJson } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

function assertScope(role: string, organizationId: string | null, id: string): void {
  if (role === "organization" && organizationId !== id) throw new ForbiddenError();
}

export async function GET(request: Request, context: Context): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    assertScope(auth.role, auth.organizationId, id);
    const organization = await (await getRepository()).getOrganization(id);
    if (!organization) throw new NotFoundError("Organization");
    return success(organization);
  });
}

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    assertScope(auth.role, auth.organizationId, id);
    const input = await parseJson(request, organizationSchema.partial().strict());
    return success(await (await getRepository()).updateOrganization(id, input));
  });
}
