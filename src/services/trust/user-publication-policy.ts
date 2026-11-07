import type { Opportunity } from "@/core/entities/domain";
import { isPublicHttpsUrl } from "@/lib/validation";
import { checklistIsComplete } from "@/services/trust/checklist";

/**
 * User-facing publication gate.
 *
 * Opportunity trust (verified + complete checklist + future deadline + official HTTPS source)
 * always applies.
 *
 * Organization verification is required only for publisher-submitted listings
 * (`origin === "organization"`). Catalog and staff-curated listings are trusted via
 * opportunity-level review; the linked organization does not need publisher verification
 * for seekers to see them.
 *
 * Publisher onboarding still requires verification before an organization can post
 * (see `publisherCanPost`).
 */
export function isUserVisibleOpportunity(opportunity: Opportunity, now = new Date()): boolean {
  const origin = opportunity.origin ?? "catalog";
  const publisherOrgVerified =
    origin !== "organization" || opportunity.organization?.verificationStatus === "verified";

  return (
    opportunity.verificationStatus === "verified" &&
    opportunity.organizationId !== null &&
    publisherOrgVerified &&
    opportunity.reviewedAt !== null &&
    (opportunity.status === "open" || opportunity.status === "closing_soon") &&
    opportunity.deadline !== null &&
    opportunity.deadline > now &&
    isPublicHttpsUrl(opportunity.sourceUrl) &&
    checklistIsComplete(opportunity.reviewChecklist)
  );
}
