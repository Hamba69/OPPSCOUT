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
  now = new Date(),
): Promise<import("@/core/entities/domain").Opportunity> {
  const opportunity = await repository.getOpportunity(id);
  if (!opportunity) throw new NotFoundError("Opportunity");
  if (approved) {
    if (!checklistIsComplete(checklist)) {
      throw new ValidationError("Every trust check must pass before approval.");
    }
    const organization = opportunity.organizationId
      ? await repository.getOrganization(opportunity.organizationId)
      : null;
    if (opportunity.origin === "organization" && (!organization || organization.verificationStatus !== "verified")) {
      throw new ValidationError("The publisher must pass organization verification before an opportunity can be approved.");
    }
    // Rolling listings have no closing date by design; the visibility policy hides them unless re-checked recently.
    const rolling = (opportunity.deadlineType ?? "fixed") === "rolling";
    if (!rolling && (!opportunity.deadline || opportunity.deadline <= now)) {
      throw new ValidationError("Only opportunities with a stated future closing date can be approved.");
    }
    if (!isPublicHttpsUrl(opportunity.sourceUrl)) {
      throw new ValidationError("The application link must be a public HTTPS URL.");
    }
  }
  // Keep the research evidence (quotes, source, retrieval time) and append the reviewer's note to it.
  const decision = `Review ${now.toISOString().slice(0, 10)}: ${approved ? "approved" : "rejected"}${notes?.trim() ? ` (${notes.trim()})` : ""}.`;
  const combinedNotes = [opportunity.reviewNotes?.trim(), decision].filter(Boolean).join("\n");
  const reviewed = await repository.reviewOpportunity(id, { checklist, approved, reviewerId, notes: combinedNotes });
  // A rejection takes the listing out of the review queue and out of every feed. The seeding
  // pipeline treats flagged + removed as "rejected by a reviewer" and never re-proposes it.
  if (!approved) return repository.updateOpportunity(id, { status: "removed" });
  return reviewed;
}
