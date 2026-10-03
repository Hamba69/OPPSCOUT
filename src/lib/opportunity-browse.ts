import "server-only";

import type { OpportunityListItem } from "@/components/opportunity-list-card";
import { allOpportunityTypes } from "@/lib/opportunity-types";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";

export interface BrowseResult { items: OpportunityListItem[]; categories: string[]; counts: Record<string, number> }

/** Open verified listings and clearly labeled catalog entries awaiting review. */
export async function browseOpportunities(userId: string, filters: { type?: string; query?: string }, now = new Date()): Promise<BrowseResult> {
  const repository = await getRepository();
  const all = await repository.listOpportunities({ statuses: ["open", "closing_soon"] });
  const open = all.filter((item) =>
    (!item.deadline || item.deadline > now) &&
    (item.verificationStatus === "verified" || (item.verificationStatus === "pending" && item.origin === "catalog")),
  );
  const categories = allOpportunityTypes(open.map((item) => item.category));
  const counts: Record<string, number> = {};
  for (const item of open) counts[item.category] = (counts[item.category] ?? 0) + 1;
  const needle = filters.query?.trim().toLowerCase() ?? "";
  const visible = open
    .filter((item) => !filters.type || item.category === filters.type)
    .filter((item) => !needle || [item.title, item.organization?.name ?? "", item.location, item.category, item.description, ...item.requiredSkills].join(" ").toLowerCase().includes(needle))
  const verifiedIds = new Set(visible.filter((item) => item.verificationStatus === "verified").map((item) => item.id));
  const matches = verifiedIds.size
    ? await buildRankedFeed(repository, userId, now, undefined, { persist: false, opportunityIds: verifiedIds })
    : [];
  const scores = new Map(matches.map((match) => [match.opportunityId, match.score]));
  const items = visible
    .sort((a, b) => Number(b.verificationStatus === "verified") - Number(a.verificationStatus === "verified") ||
      (scores.get(b.id) ?? -1) - (scores.get(a.id) ?? -1) ||
      (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity))
    .map((item) => ({ id: item.id, title: item.title, organization: item.organization?.name ?? "Source organization", origin: item.origin ?? "catalog", verificationStatus: item.verificationStatus, category: item.category, location: item.location, workMode: item.workMode, deadline: item.deadline, matchScore: item.verificationStatus === "verified" ? scores.get(item.id) ?? null : null }));
  return { items, categories, counts };
}
