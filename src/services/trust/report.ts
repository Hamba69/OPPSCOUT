import type { Repository } from "@/lib/repository/types";
import { recordEvent } from "@/services/kpi/events";

export async function reportSuspiciousListing(
  repository: Repository,
  userId: string,
  opportunityId: string,
  reason: string,
  details?: string,
): Promise<void> {
  await repository.setOpportunityFlagged(opportunityId);
  await recordEvent(repository, "report", userId, opportunityId, { reason, details: details ?? null });
}
