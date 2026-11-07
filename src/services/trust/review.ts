import { NotFoundError, ValidationError } from "@/core/errors/app-error";
import type { TrustChecklist } from "@/core/entities/domain";
import type { Repository } from "@/lib/repository/types";
import { isPublicHttpsUrl } from "@/lib/validation";
import { checklistIsComplete } from "@/services/trust/checklist";

export async function reviewOpportunity(
  repository: Repository,
  id: string,
  reviewerId: string,
  checklist: TrustChecklist,
  approved: boolean,
  notes?: string,
): Promise<import("@/core/entities/domain").Opportunity> {
  if (approved) {
    if (!checklistIsComplete(checklist)) {
      throw new ValidationError("Every trust check must pass before approval.");
    }
    const opportunity = await repository.getOpportunity(id);
    if (!opportunity) throw new NotFoundError("Opportunity");
    const organization = opportunity.organizationId
      ? await repository.getOrganization(opportunity.organizationId)
      : null;
    if (!organization || organization.verificationStatus !== "verified") {
      throw new ValidationError("The publisher must pass organization verification before an opportunity can be approved.");
    }
    if (!opportunity.deadline || opportunity.deadline <= new Date()) {
      throw new ValidationError("Only opportunities with a stated future closing date can be approved.");
    }
    if (!isPublicHttpsUrl(opportunity.sourceUrl)) {
      throw new ValidationError("The application link must be a public HTTPS URL.");
    }
  }
  return repository.reviewOpportunity(id, { checklist, approved, reviewerId, notes });
}
