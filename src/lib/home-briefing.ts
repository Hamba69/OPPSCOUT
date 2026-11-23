import "server-only";

import { APP_TIME_ZONE, formatDate } from "@/lib/dates";
import { loadFeedItems } from "@/lib/feed-items";
import { allOpportunityTypes } from "@/lib/opportunity-types";
import { getRepository } from "@/lib/repository";
import { displayTitle } from "@/lib/opportunity-title";
import type { UserProfile } from "@/core/entities/domain";
import { choiceLabel } from "@/services/profile/choices";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";

/** "Closing soon" covers deadlines within this many days. */
export const CLOSING_WINDOW_DAYS = 14;
/** The home page shows at most this many closing-soon rows. */
const CLOSING_ROWS = 2;

export interface ClosingItem { opportunityId: string; title: string; detail: string; daysLeft: number }
export interface NewTile { type: string; label: string; count: number }

const daysUntil = (deadline: Date, now: Date): number => Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
const closesOn = (deadline: Date | string): string => formatDate(deadline, { day: "numeric", month: "short" });

/** Saved (not yet applied) opportunities whose deadline is within the window, nearest first. */
export async function loadSavedClosing(userId: string, now = new Date()): Promise<ClosingItem[]> {
  const repository = await getRepository();
  const saved = (await repository.listSaved(userId)).filter((item) => item.status === "saved");
  if (!saved.length) return [];
  const opportunities = await repository.listOpportunities({ opportunityIds: saved.map((item) => item.opportunityId) });
  return opportunities
    .filter((opportunity) => opportunity.deadline && isUserVisibleOpportunity(opportunity, now))
    .map((opportunity) => ({ opportunity, daysLeft: daysUntil(opportunity.deadline!, now) }))
    .filter(({ daysLeft }) => daysLeft > 0 && daysLeft <= CLOSING_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, CLOSING_ROWS)
    .map(({ opportunity, daysLeft }) => ({
      opportunityId: opportunity.id,
      title: displayTitle(opportunity.title, opportunity.organization?.name ?? opportunity.organizationName),
      detail: `${opportunity.organization?.name ?? opportunity.organizationName ?? "Source organization"} · closes ${closesOn(opportunity.deadline!)}`,
      daysLeft,
    }));
}

/** With nothing saved closing soon: the seeker's own matches with the nearest deadlines. Runs matching. */
export async function loadMatchClosing(userId: string, profile: UserProfile, now = new Date()): Promise<ClosingItem[]> {
  const items = await loadFeedItems(userId, profile, now);
  return items
    .filter((item) => item.deadline && item.daysLeft !== null && item.daysLeft > 0 && item.daysLeft <= CLOSING_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft! - b.daysLeft!)
    .slice(0, CLOSING_ROWS)
    .map((item) => ({ opportunityId: item.opportunityId, title: item.title, detail: `${item.score}% match · closes ${closesOn(item.deadline!)}`, daysLeft: item.daysLeft! }));
}

/** The calendar day of a moment in Uganda time, as YYYY-MM-DD. */
const ugandaDay = (moment: Date): string => new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(moment);

/**
 * Open listings that went live on OppScout today (Uganda time), counted by type: the day they were approved,
 * not the day the source posted them, so a listing seeded today counts even if it was posted last week.
 * Types with nothing new today are left out.
 */
export async function loadNewToday(now = new Date()): Promise<NewTile[]> {
  const repository = await getRepository();
  const open = await repository.listOpportunities({ statuses: ["open", "closing_soon"] });
  const today = ugandaDay(now);
  const counts = new Map<string, number>();
  for (const item of open) {
    if (!isUserVisibleOpportunity(item, now) || ugandaDay(item.reviewedAt ?? item.publicationDate) !== today) continue;
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return allOpportunityTypes([...counts.keys()]).map((type) => ({ type, label: choiceLabel(type), count: counts.get(type) ?? 0 }));
}
