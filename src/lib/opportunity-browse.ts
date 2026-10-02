import "server-only";

import type { OpportunityListItem } from "@/components/opportunity-list-card";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";

export interface BrowseResult { items: OpportunityListItem[]; categories: string[] }

/** Open, verified opportunities for a signed-in seeker, optionally narrowed by type and free text. */
export async function browseOpportunities(userId: string, filters: { type?: string; query?: string }, now = new Date()): Promise<BrowseResult> {
  const repository = await getRepository();
  const [all, matches] = await Promise.all([
    repository.listOpportunities({ verificationStatus: "verified", statuses: ["open", "closing_soon"] }),
    buildRankedFeed(repository, userId, now, undefined, { persist: false }),
  ]);
  const scores = new Map(matches.map((match) => [match.opportunityId, match.score]));
  const open = all.filter((item) => !item.deadline || item.deadline > now);
  const categories = [...new Set(open.map((item) => item.category))].sort();
  const needle = filters.query?.trim().toLowerCase() ?? "";
  const items = open
    .filter((item) => !filters.type || item.category === filters.type)
    .filter((item) => !needle || [item.title, item.organization?.name ?? "", item.location, item.category, item.description, ...item.requiredSkills].join(" ").toLowerCase().includes(needle))
    .sort((a, b) => (scores.get(b.id) ?? -1) - (scores.get(a.id) ?? -1) || (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity))
    .map((item) => ({ id: item.id, title: item.title, organization: item.organization?.name ?? "Verified organization", category: item.category, location: item.location, workMode: item.workMode, deadline: item.deadline, matchScore: scores.get(item.id) ?? null }));
  return { items, categories };
}
