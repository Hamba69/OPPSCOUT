import "server-only";

import type { FeedItem } from "@/components/feed-browser";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";
import { choiceLabel } from "@/services/profile/choices";
import { isNewListing } from "@/components/score-first-card";
import type { UserProfile } from "@/core/entities/domain";

/** The seeker's ranked matches shaped for the feed cards. Shared by the home feed and the per-category pages. */
export async function loadFeedItems(userId: string, profile: UserProfile, now = new Date()): Promise<FeedItem[]> {
  const repository = await getRepository();
  const matches = await buildRankedFeed(repository, userId, now, undefined, { persist: false, profile });
  return matches.map((match) => {
    const opportunity = match.opportunity!;
    const daysLeft = opportunity.deadline ? Math.ceil((opportunity.deadline.getTime() - now.getTime()) / 86_400_000) : null;
    return { daysLeft, id: match.id, opportunityId: opportunity.id, category: opportunity.category, categoryLabel: choiceLabel(opportunity.category), title: opportunity.title, organization: opportunity.organization?.name ?? opportunity.organizationName ?? "Source organization", origin: opportunity.origin ?? "catalog", score: match.score, deadline: opportunity.deadline?.toISOString() ?? null, location: opportunity.location, workMode: opportunity.workMode === "unknown" ? "" : opportunity.workMode, sourceUrl: opportunity.sourceUrl, checkedAt: opportunity.checkedAt.toISOString(), publicationDate: opportunity.publicationDate.toISOString(), isNew: isNewListing(opportunity.publicationDate, now) };
  });
}
