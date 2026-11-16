import { INGESTION_RULES } from "@/config/ingestion-rules";
import { NotFoundError } from "@/core/errors/app-error";
import type { Opportunity } from "@/core/entities/domain";
import type { Repository } from "@/lib/repository/types";
import { visibilityFailures } from "@/services/trust/user-publication-policy";

const DAY = 86_400_000;

/** One-click repairs the catalogue owner can apply from Admin > Catalogue fixes. */
export const FIX_ACTIONS = ["send-to-review", "mark-checked", "remove"] as const;
export type FixAction = (typeof FIX_ACTIONS)[number];

export interface FixableListing {
  opportunity: Opportunity;
  /** Plain-language reasons the listing is hidden (empty for "re-check due" items, which are still live). */
  reasons: string[];
  /** Repairs that address the reasons, best first. */
  actions: FixAction[];
  daysSinceCheck: number;
}

function plain(failure: string): { reason: string; action: FixAction | null } {
  if (failure === "no linked organisation") return { reason: "No provider named or linked", action: "send-to-review" };
  if (failure.startsWith("checklist incomplete")) return { reason: "Approved before the full review checklist existed", action: "send-to-review" };
  if (failure === "not reviewed") return { reason: "Marked approved without a review date", action: "send-to-review" };
  if (failure === "rolling listing has not been re-checked recently") return { reason: `Rolling listing not re-checked in ${INGESTION_RULES.rollingFreshnessDays} days`, action: "mark-checked" };
  if (failure === "publisher organisation is not verified") return { reason: "Posted by a publisher that is not verified yet", action: null };
  if (failure === "source URL is not public HTTPS") return { reason: "Source link is not a public https:// page", action: "remove" };
  return { reason: failure.charAt(0).toUpperCase() + failure.slice(1), action: null };
}

function stillOpen(opportunity: Opportunity, now: Date): boolean {
  return (opportunity.status === "open" || opportunity.status === "closing_soon") && (opportunity.deadline === null || opportunity.deadline > now);
}

/** Approved, still-open listings that seekers cannot see, with the reason and the fix for each. */
export function hiddenApprovedListings(opportunities: Opportunity[], now = new Date()): FixableListing[] {
  return opportunities
    .filter((opportunity) => opportunity.verificationStatus === "verified" && stillOpen(opportunity, now))
    .map((opportunity) => {
      const explained = visibilityFailures(opportunity, now).map(plain);
      return {
        opportunity,
        reasons: explained.map((item) => item.reason),
        actions: [...new Set(explained.map((item) => item.action).filter((action): action is FixAction => action !== null))],
        daysSinceCheck: Math.floor((now.getTime() - opportunity.checkedAt.getTime()) / DAY),
      };
    })
    .filter((item) => item.reasons.length > 0)
    .sort((a, b) => (a.opportunity.deadline?.getTime() ?? Infinity) - (b.opportunity.deadline?.getTime() ?? Infinity));
}

/** Live listings that the freshness job will remove within `withinDays` unless they are re-confirmed. */
export function recheckDueListings(opportunities: Opportunity[], now = new Date(), withinDays = 4): FixableListing[] {
  return opportunities
    .filter((opportunity) => visibilityFailures(opportunity, now).length === 0)
    .filter((opportunity) => {
      const staleAfter = opportunity.source === "scraped" ? INGESTION_RULES.scrapedStaleAfterDays : INGESTION_RULES.organizationStaleAfterDays;
      return now.getTime() - opportunity.checkedAt.getTime() > (staleAfter - withinDays) * DAY;
    })
    .map((opportunity) => ({ opportunity, reasons: [], actions: ["mark-checked", "remove"] as FixAction[], daysSinceCheck: Math.floor((now.getTime() - opportunity.checkedAt.getTime()) / DAY) }))
    .sort((a, b) => b.daysSinceCheck - a.daysSinceCheck);
}

/**
 * Applies one repair. Every action is reversible from the review queue or by editing the record, and
 * none of them makes a listing visible without it having passed review.
 */
export async function applyCatalogueFix(repository: Repository, id: string, action: FixAction, now = new Date()): Promise<Opportunity> {
  const opportunity = await repository.getOpportunity(id);
  if (!opportunity) throw new NotFoundError("Opportunity");
  switch (action) {
    case "send-to-review":
      return repository.updateOpportunity(id, { verificationStatus: "pending" });
    case "mark-checked":
      return repository.updateOpportunity(id, { checkedAt: now, ...(opportunity.status === "stale" ? { status: "open" as const } : {}) });
    case "remove":
      return repository.updateOpportunity(id, { status: "removed" });
  }
}
