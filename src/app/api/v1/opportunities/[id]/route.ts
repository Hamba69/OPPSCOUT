import { ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import { apiHandler, noContent, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { opportunitySchema, parseJson } from "@/lib/validation";
import { containsSuspiciousRequest } from "@/services/trust/checklist";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const { id } = await context.params;
    const opportunity = await (await getRepository()).getOpportunity(id);
    if (!opportunity || (auth.role === "user" && opportunity.verificationStatus !== "verified")) throw new NotFoundError("Opportunity");
    return success(opportunity, 200, opportunity.checkedAt);
  });
}

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    const repository = await getRepository();
    const current = await repository.getOpportunity(id);
    if (!current) throw new NotFoundError("Opportunity");
    if (auth.role === "organization" && (current.organizationId !== auth.organizationId || current.origin !== "organization")) throw new ForbiddenError();
    const input = await parseJson(request, opportunitySchema.partial());
    if (auth.role === "organization" && input.organizationId && input.organizationId !== current.organizationId) throw new ForbiddenError();
    const updated = { ...current, ...input };
    const suspicious = containsSuspiciousRequest(`${updated.title} ${updated.description} ${updated.applicationMethod}`);
    const opportunity = await repository.updateOpportunity(id, {
      ...input,
      // Only the trust-review endpoint can approve revised content.
      verificationStatus: suspicious || current.verificationStatus === "flagged" ? "flagged" : "pending",
    });
    return success(opportunity, 200, opportunity.checkedAt);
  });
}

export async function DELETE(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    const repository = await getRepository();
    const current = await repository.getOpportunity(id);
    if (!current) throw new NotFoundError("Opportunity");
    if (auth.role === "organization" && (current.organizationId !== auth.organizationId || current.origin !== "organization")) throw new ForbiddenError();
    await repository.deleteOpportunity(id);
    return noContent();
  });
}
