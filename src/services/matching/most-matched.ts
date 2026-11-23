import type { Opportunity } from "@/core/entities/domain";
import { isMatchScore } from "@/config/match-threshold";
import type { Repository } from "@/lib/repository/types";
import { buildRankedFeed } from "@/services/matching/feed";
import { isProfileCompleteForMatching } from "@/services/profile/completeness";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";

export interface MostMatched { opportunity: Opportunity; seekers: number }

/** Profiles scored at once. Keeps the run quick without flooding the database. */
const BATCH = 8;

/** Most matched first; ties go to the listing closing sooner, then the newer one. Listings nobody matches are left out. */
export function rankMostMatched(opportunities: Opportunity[], counts: ReadonlyMap<string, number>, limit: number): MostMatched[] {
  return opportunities
    .map((opportunity) => ({ opportunity, seekers: counts.get(opportunity.id) ?? 0 }))
    .filter((item) => item.seekers > 0)
    .sort((a, b) => b.seekers - a.seekers
      || (a.opportunity.deadline?.getTime() ?? Infinity) - (b.opportunity.deadline?.getTime() ?? Infinity)
      || b.opportunity.publicationDate.getTime() - a.opportunity.publicationDate.getTime())
    .slice(0, limit);
}

/**
 * The live opportunities matched to the most people on OppScout right now: every seeker whose profile is
 * ready for matching is scored against the open catalogue with the same engine and match bar as their own
 * feed, and each listing counts the seekers it reaches. Only counts leave this function, never who matched.
 * Matches are worked out on the fly rather than stored, so this runs the matching for everyone; callers
 * should cache the result.
 */
export async function mostMatchedOpportunities(repository: Repository, now = new Date(), limit = 5): Promise<MostMatched[]> {
  const [profiles, listed] = await Promise.all([
    repository.listProfiles(),
    repository.listOpportunities({ verificationStatus: "verified", statuses: ["open", "closing_soon"] }),
  ]);
  const opportunities = listed.filter((item) => isUserVisibleOpportunity(item, now));
  const seekers = profiles.filter(isProfileCompleteForMatching);
  const counts = new Map<string, number>();
  for (let start = 0; start < seekers.length; start += BATCH) {
    const results = await Promise.all(seekers.slice(start, start + BATCH).map((profile) =>
      buildRankedFeed(repository, profile.id, now, undefined, { persist: false, telemetry: false, profile, opportunities, includePersistedMatches: false })
        .catch(() => [])));
    for (const matches of results) {
      for (const match of matches) if (isMatchScore(match.score)) counts.set(match.opportunityId, (counts.get(match.opportunityId) ?? 0) + 1);
    }
  }
  return rankMostMatched(opportunities, counts, limit);
}
