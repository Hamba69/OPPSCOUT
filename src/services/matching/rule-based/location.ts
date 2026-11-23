import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { DimensionScore } from "@/services/matching/rule-based/field-relevance";
import { placeOf } from "@/data/uganda-locations";
import { locationSimilarity } from "@/services/matching/orbit/canonical";

export function scoreLocation(profile: UserProfile, opportunity: Opportunity): DimensionScore {
  const remote = opportunity.workMode === "remote" || placeOf(opportunity.location)?.kind === "remote";
  const preferences = [profile.location ?? "", ...profile.preferredLocations].filter(Boolean);
  // Same district (however it is written), anywhere in Uganda, or a district next door counts as a fit.
  const matches = remote || preferences.some((place) => locationSimilarity(place, opportunity.location) >= 0.85);
  return matches
    ? {
        ratio: 1,
        matched: [{
          label: "Location",
          detail: remote
            ? `Remote work fits your profile${preferences.length ? ` (you listed: ${preferences.slice(0, 3).join(", ")})` : ""}.`
            : `${opportunity.location} fits your location preferences${preferences.length ? ` (${preferences.slice(0, 3).join(", ")})` : ""}.`,
        }],
        missing: [],
      }
    : {
        ratio: 0,
        matched: [],
        missing: [{
          label: "Location",
          detail: preferences.length
            ? `${opportunity.location} is outside your saved preferences (${preferences.slice(0, 3).join(", ")}).`
            : `Add a location preference. This listing is in ${opportunity.location}.`,
        }],
      };
}
