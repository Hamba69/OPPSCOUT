import { ValidationError } from "@/core/errors/app-error";
import type { TrustChecklist } from "@/core/entities/domain";
import type { Repository } from "@/lib/repository/types";
import { checklistIsComplete } from "@/services/trust/checklist";

export async function reviewOpportunity(
  repository: Repository,
  id: string,
  reviewerId: string,
  checklist: TrustChecklist,
  approved: boolean,
  notes?: string,
): Promise<import("@/core/entities/domain").Opportunity> {
  if (approved && !checklistIsComplete(checklist)) {
    throw new ValidationError("Every trust check must pass before approval.");
  }
  return repository.reviewOpportunity(id, { checklist, approved, reviewerId, notes });
}
