import { ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import { apiHandler, noContent, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { opportunitySchema, parseJson } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const { id } = await context.params;
    const opportunity = await (await getRepository()).getOpportunity(id);
    if (!opportunity || (auth.role === "user" && opportunity.verificationStatus !== "verified")) throw new NotFoundError("Opportunity");
    return success(opportunity, 200, opportunity.checkedAt);
  });
}

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    const repository = await getRepository();
    const current = await repository.getOpportunity(id);
    if (!current) throw new NotFoundError("Opportunity");
    if (auth.role === "organization" && current.organizationId !== auth.organizationId) throw new ForbiddenError();
    const input = await parseJson(request, opportunitySchema.partial());
    const opportunity = await repository.updateOpportunity(id, { ...input, checkedAt: new Date() });
    return success(opportunity, 200, opportunity.checkedAt);
  });
}

export async function DELETE(request: Request, context: Context): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    const repository = await getRepository();
    const current = await repository.getOpportunity(id);
    if (!current) throw new NotFoundError("Opportunity");
    if (auth.role === "organization" && current.organizationId !== auth.organizationId) throw new ForbiddenError();
    await repository.deleteOpportunity(id);
    return noContent();
  });
}
