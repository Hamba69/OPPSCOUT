import { INGESTION_RULES } from "@/config/ingestion-rules";
import type { Opportunity } from "@/core/entities/domain";
import type { Repository } from "@/lib/repository/types";

export interface FreshnessRun {
  checked: number;
  changed: number;
  closed: number;
  stale: number;
}

export async function refreshOpportunityLifecycle(repository: Repository, now = new Date()): Promise<FreshnessRun> {
  const opportunities = await repository.listOpportunities();
  const result: FreshnessRun = { checked: opportunities.length, changed: 0, closed: 0, stale: 0 };
  for (const opportunity of opportunities) {
    let status: Opportunity["status"] = opportunity.status;
    if (opportunity.deadline <= now && !["closed", "removed"].includes(opportunity.status)) {
      status = "closed";
      result.closed += 1;
    } else if (!["closed", "removed"].includes(opportunity.status)) {
      const staleDays = opportunity.source === "scraped" ? INGESTION_RULES.scrapedStaleAfterDays : INGESTION_RULES.organizationStaleAfterDays;
      if (now.getTime() - opportunity.checkedAt.getTime() > staleDays * 86_400_000) {
        status = "stale";
        result.stale += 1;
      }
    }
    if (status !== opportunity.status) {
      await repository.updateOpportunity(opportunity.id, { status });
      result.changed += 1;
    }
  }
  return result;
}
