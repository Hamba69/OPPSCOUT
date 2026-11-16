import { INGESTION_RULES } from "@/config/ingestion-rules";
import type { Opportunity, Organization } from "@/core/entities/domain";
import { visibilityFailures } from "@/services/trust/user-publication-policy";

const DAY = 86_400_000;

/**
 * Only organisations that signed up through the app (and so have a dashboard user) need publisher
 * verification. Organisations created by seeding exist only to name a listing's provider; their
 * listings are verified one by one in the review queue, so they never wait for verification themselves.
 */
export function isPublisherOrganization(organization: Pick<Organization, "dashboardUsers"> | { dashboardUsers?: unknown }): boolean {
  return Array.isArray(organization.dashboardUsers) && organization.dashboardUsers.length > 0;
}

export interface ClosingSoonItem { id: string; title: string; organization: string; category: string; deadline: Date; daysLeft: number; sourceUrl: string }

export interface CatalogueSummary {
  /** Listings seekers can see right now. */
  live: number;
  liveByCategory: Array<{ category: string; count: number }>;
  closingIn3Days: number;
  closingIn7Days: number;
  rolling: number;
  /** Live listings that will be removed within 4 days because nobody has re-checked them. */
  staleSoon: number;
  /** Waiting in the review queue (pending, not expired). */
  awaitingReview: number;
  /** Reported by users and not yet resolved. */
  reported: number;
  /** Approved, still open, but hidden from seekers; with the most common reason. */
  approvedButHidden: number;
  approvedButHiddenReason: string | null;
  approvedLast7Days: number;
  expiredLast7Days: number;
  closingSoon: ClosingSoonItem[];
}

function staleAfterDays(opportunity: Opportunity): number {
  return opportunity.source === "scraped" ? INGESTION_RULES.scrapedStaleAfterDays : INGESTION_RULES.organizationStaleAfterDays;
}

export function summarizeCatalogue(opportunities: Opportunity[], now = new Date(), closingSoonLimit = 8): CatalogueSummary {
  const live: Opportunity[] = [];
  const hiddenReasons = new Map<string, number>();
  let approvedButHidden = 0;
  for (const opportunity of opportunities) {
    const failures = visibilityFailures(opportunity, now);
    if (!failures.length) { live.push(opportunity); continue; }
    const stillOpen = (opportunity.status === "open" || opportunity.status === "closing_soon") && (opportunity.deadline === null || opportunity.deadline > now);
    if (opportunity.verificationStatus === "verified" && stillOpen) {
      approvedButHidden += 1;
      for (const failure of failures) { const key = failure.replace(/:.*/, ""); hiddenReasons.set(key, (hiddenReasons.get(key) ?? 0) + 1); }
    }
  }
  const byCategory = new Map<string, number>();
  for (const opportunity of live) byCategory.set(opportunity.category, (byCategory.get(opportunity.category) ?? 0) + 1);
  const daysLeft = (deadline: Date) => Math.ceil((deadline.getTime() - now.getTime()) / DAY);
  const fixedLive = live.filter((opportunity) => opportunity.deadline !== null && (opportunity.deadlineType ?? "fixed") === "fixed");
  const open = (opportunity: Opportunity) => opportunity.status !== "removed" && opportunity.status !== "closed" && (opportunity.deadline === null || opportunity.deadline > now);
  return {
    live: live.length,
    liveByCategory: [...byCategory].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    closingIn3Days: fixedLive.filter((opportunity) => daysLeft(opportunity.deadline!) <= 3).length,
    closingIn7Days: fixedLive.filter((opportunity) => daysLeft(opportunity.deadline!) <= 7).length,
    rolling: live.filter((opportunity) => (opportunity.deadlineType ?? "fixed") === "rolling").length,
    staleSoon: live.filter((opportunity) => now.getTime() - opportunity.checkedAt.getTime() > (staleAfterDays(opportunity) - 4) * DAY).length,
    awaitingReview: opportunities.filter((opportunity) => opportunity.verificationStatus === "pending" && open(opportunity)).length,
    reported: opportunities.filter((opportunity) => opportunity.verificationStatus === "flagged" && open(opportunity)).length,
    approvedButHidden,
    approvedButHiddenReason: [...hiddenReasons].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    approvedLast7Days: opportunities.filter((opportunity) => opportunity.verificationStatus === "verified" && opportunity.reviewedAt !== null && now.getTime() - opportunity.reviewedAt.getTime() <= 7 * DAY && opportunity.reviewedAt <= now).length,
    expiredLast7Days: opportunities.filter((opportunity) => opportunity.verificationStatus === "verified" && opportunity.deadline !== null && opportunity.deadline <= now && now.getTime() - opportunity.deadline.getTime() <= 7 * DAY).length,
    closingSoon: [...fixedLive].sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime()).slice(0, closingSoonLimit).map((opportunity) => ({
      id: opportunity.id,
      title: opportunity.title,
      organization: opportunity.organization?.name ?? opportunity.organizationName ?? "Unknown provider",
      category: opportunity.category,
      deadline: opportunity.deadline!,
      daysLeft: daysLeft(opportunity.deadline!),
      sourceUrl: opportunity.sourceUrl,
    })),
  };
}
