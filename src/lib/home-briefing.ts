import "server-only";

import { formatDate } from "@/lib/dates";
import type { FeedItem } from "@/components/feed-browser";
import { getRepository } from "@/lib/repository";
import { displayTitle, shortTitle } from "@/lib/opportunity-title";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";
import { mostMatchedOpportunities } from "@/services/matching/most-matched";

/** "Closing soon" covers deadlines within this many days. */
export const CLOSING_WINDOW_DAYS = 14;
/** The home page shows at most this many closing-soon rows. */
const CLOSING_ROWS = 2;

export interface ClosingItem { opportunityId: string; title: string; detail: string; daysLeft: number }
export interface MostMatchedRow { opportunityId: string; title: string; shortTitle: string; organization: string; detail: string; category: string; seekers: number }

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
/** The seeker's matches closing first, from feed items already loaded. */
export function matchClosing(items: FeedItem[]): ClosingItem[] {
  return items
    .filter((item) => item.deadline && item.daysLeft !== null && item.daysLeft > 0 && item.daysLeft <= CLOSING_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft! - b.daysLeft!)
    .slice(0, CLOSING_ROWS)
    .map((item) => ({ opportunityId: item.opportunityId, title: item.title, detail: `${item.score}% match · closes ${closesOn(item.deadline!)}`, daysLeft: item.daysLeft! }));
}

/** How many listings the "Most matched this week" section shows. */
export const MOST_MATCHED_ROWS = 5;
/** Scoring every seeker is heavy, so the result is reused for this long. */
const MOST_MATCHED_TTL_MS = 6 * 60 * 60 * 1000;
let mostMatchedCache: { at: number; value: Promise<MostMatchedRow[]> } | null = null;

/**
 * The opportunities matched to the most people across OppScout: the same list for everyone, refreshed every
 * few hours. Shows counts only, never who matched.
 */
export async function loadMostMatched(now = new Date()): Promise<MostMatchedRow[]> {
  if (mostMatchedCache && now.getTime() - mostMatchedCache.at < MOST_MATCHED_TTL_MS) return mostMatchedCache.value;
  const value = (async () => {
    const ranked = await mostMatchedOpportunities(await getRepository(), now, MOST_MATCHED_ROWS);
    return ranked.map(({ opportunity, seekers }) => {
      const organization = opportunity.organization?.name ?? opportunity.organizationName ?? "Source organization";
      return {
        opportunityId: opportunity.id,
        title: displayTitle(opportunity.title, organization),
        shortTitle: shortTitle(opportunity.title, organization),
        organization,
        detail: [organization, opportunity.deadline ? `closes ${closesOn(opportunity.deadline)}` : "open until filled"].join(" · "),
        category: opportunity.category,
        seekers,
      };
    });
  })();
  mostMatchedCache = { at: now.getTime(), value };
  // A failed run must not be served from the cache.
  value.catch(() => { if (mostMatchedCache?.value === value) mostMatchedCache = null; });
  return value;
}
