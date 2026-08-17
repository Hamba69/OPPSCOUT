import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { DimensionScore } from "@/services/matching/rule-based/field-relevance";
import { includesNormalized, normalize } from "@/services/matching/rule-based/normalize";

export function scoreLocation(profile: UserProfile, opportunity: Opportunity): DimensionScore {
  const remote = opportunity.workMode === "remote" || normalize(opportunity.location) === "remote";
  const preferences = [profile.location ?? "", ...profile.preferredLocations];
  const matches = remote || includesNormalized(preferences, opportunity.location) || normalize(opportunity.location) === "uganda";
  return matches
    ? { ratio: 1, matched: [{ label: "Location", detail: remote ? "This can be done remotely." : `${opportunity.location} fits your location preferences.` }], missing: [] }
    : { ratio: 0, matched: [], missing: [{ label: "Location", detail: `${opportunity.location} is outside your saved preferences.` }] };
}
