import type { Opportunity } from "@/core/entities/domain";
import { isPublicHttpsUrl } from "@/lib/validation";
import { checklistIsComplete } from "@/services/trust/checklist";

export function isUserVisibleOpportunity(opportunity: Opportunity, now = new Date()): boolean {
  return opportunity.verificationStatus === "verified" &&
    opportunity.organizationId !== null &&
    opportunity.organization?.verificationStatus === "verified" &&
    opportunity.reviewedAt !== null &&
    (opportunity.status === "open" || opportunity.status === "closing_soon") &&
    opportunity.deadline !== null &&
    opportunity.deadline > now &&
    isPublicHttpsUrl(opportunity.sourceUrl) &&
    checklistIsComplete(opportunity.reviewChecklist);
}
