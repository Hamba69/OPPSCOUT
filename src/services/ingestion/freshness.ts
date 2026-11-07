import { INGESTION_RULES } from "@/config/ingestion-rules";
import type { Opportunity } from "@/core/entities/domain";
import type { Repository } from "@/lib/repository/types";

export interface FreshnessRun {
  checked: number;
  changed: number;
  expired: number;
  stale: number;
  removed: number;
}

export async function refreshOpportunityLifecycle(repository: Repository, now = new Date()): Promise<FreshnessRun> {
  const opportunities = await repository.listOpportunities();
  const result: FreshnessRun = { checked: opportunities.length, changed: 0, expired: 0, stale: 0, removed: 0 };
  for (const opportunity of opportunities) {
    if (opportunity.status === "removed") continue;
    let status: Opportunity["status"] = opportunity.status;
    if (opportunity.deadline && opportunity.deadline <= now) {
      status = "removed";
      result.expired += 1;
      result.removed += 1;
    } else if (opportunity.status !== "closed") {
      const staleDays = opportunity.source === "scraped" ? INGESTION_RULES.scrapedStaleAfterDays : INGESTION_RULES.organizationStaleAfterDays;
      if (now.getTime() - opportunity.checkedAt.getTime() > staleDays * 86_400_000) {
        status = "removed";
        result.stale += 1;
        result.removed += 1;
      }
    }
    if (status !== opportunity.status) {
      await repository.updateOpportunity(opportunity.id, { status });
      result.changed += 1;
    }
  }
  return result;
}
