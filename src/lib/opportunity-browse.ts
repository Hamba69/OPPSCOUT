import "server-only";

import type { OpportunityListItem } from "@/components/opportunity-list-card";
import { allOpportunityTypes } from "@/lib/opportunity-types";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";

export interface BrowseResult { items: OpportunityListItem[]; categories: string[]; counts: Record<string, number> }

/** Show all trusted, current opportunities and rank personal matches within that safe set. */
export async function browseOpportunities(userId: string, filters: { type?: string; query?: string }, now = new Date()): Promise<BrowseResult> {
  const repository = await getRepository();
  const [all, profile] = await Promise.all([
    repository.listOpportunities({ statuses: ["open", "closing_soon"] }),
    repository.getProfile(userId),
  ]);
  const open = all.filter((item) => isUserVisibleOpportunity(item, now));
  const categories = allOpportunityTypes(open.map((item) => item.category));
  const counts: Record<string, number> = {};
  for (const item of open) counts[item.category] = (counts[item.category] ?? 0) + 1;
  const matches = open.length && profile
    ? await buildRankedFeed(repository, userId, now, undefined, {
        persist: false,
        telemetry: false,
        profile,
        opportunities: open,
      })
    : [];
  const scores = new Map(matches.map((match) => [match.opportunityId, match.score]));
  const needle = filters.query?.trim().toLowerCase() ?? "";
  const visible = open
    .filter((item) => !filters.type || item.category === filters.type)
    .filter((item) => !needle || [item.title, item.organization?.name ?? "", item.location, item.category, item.description, ...item.requiredSkills].join(" ").toLowerCase().includes(needle));
  const items = visible
    .sort((a, b) => (scores.get(b.id) ?? -1) - (scores.get(a.id) ?? -1) ||
      (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity))
    .map((item) => ({ id: item.id, title: item.title, organization: item.organization?.name ?? item.organizationName ?? "Source organization", origin: item.origin ?? "catalog", verificationStatus: item.verificationStatus, category: item.category, location: item.location, workMode: item.workMode, deadline: item.deadline, matchScore: scores.get(item.id) ?? null }));
  return { items, categories, counts };
}
