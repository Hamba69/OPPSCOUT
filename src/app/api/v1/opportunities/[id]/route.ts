import { ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import { apiHandler, noContent, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { memberOpportunitySchema, opportunitySchema, parseJson } from "@/lib/validation";
import { ownsListing, updateMemberOpportunity } from "@/services/ingestion/member-submission";
import { containsSuspiciousRequest } from "@/services/trust/checklist";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";
import { publicOpportunity } from "@/services/trust/public-opportunity";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const { id } = await context.params;
    const repository = await getRepository();
    const opportunity = await repository.getOpportunity(id);
    if (!opportunity) throw new NotFoundError("Opportunity");
    // Admins and whoever posted the listing see everything; everyone else sees only live listings,
    // without moderation fields or the poster's contact details.
    if (auth.role === "admin" || ownsListing(auth, opportunity)) return success(opportunity, 200, opportunity.checkedAt);
    if (!isUserVisibleOpportunity(opportunity)) throw new NotFoundError("Opportunity");
    return success(publicOpportunity(opportunity), 200, opportunity.checkedAt);
  });
}

/** The poster edits their listing (it goes back to review); admins can edit any listing. */
export async function PATCH(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const { id } = await context.params;
    const repository = await getRepository();
    if (auth.role !== "admin") {
      const input = await parseJson(request, memberOpportunitySchema.partial());
      const updated = await updateMemberOpportunity(repository, auth, id, input);
      return success(updated, 200, updated.checkedAt);
    }
    const current = await repository.getOpportunity(id);
    if (!current) throw new NotFoundError("Opportunity");
    const input = await parseJson(request, opportunitySchema.partial());
    const merged = { ...current, ...input };
    const suspicious = containsSuspiciousRequest(`${merged.title} ${merged.description} ${merged.applicationMethod}`);
    const opportunity = await repository.updateOpportunity(id, {
      ...input,
      ...(input.deadline !== undefined ? { deadlineType: input.deadline ? "fixed" as const : "rolling" as const } : {}),
      // Only the trust-review endpoint can approve revised content.
      verificationStatus: suspicious || current.verificationStatus === "flagged" ? "flagged" : "pending",
    });
    return success(opportunity, 200, opportunity.checkedAt);
  });
}

/** The poster removes their listing; admins can remove any listing. */
export async function DELETE(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const { id } = await context.params;
    const repository = await getRepository();
    const current = await repository.getOpportunity(id);
    if (!current) throw new NotFoundError("Opportunity");
    if (auth.role !== "admin" && !ownsListing(auth, current)) throw new ForbiddenError();
    await repository.deleteOpportunity(id);
    return noContent();
  });
}
