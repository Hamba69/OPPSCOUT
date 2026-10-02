import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { DimensionScore } from "@/services/matching/rule-based/field-relevance";

export function scoreWorkMode(profile: UserProfile, opportunity: Opportunity): DimensionScore {
  if (!profile.workModePreference) {
    return {
      ratio: 0.5,
      matched: [],
      missing: [{
        label: "Work mode",
        detail: `This listing is ${opportunity.workMode}. Add a work-mode preference on your profile to sharpen the match.`,
      }],
    };
  }
  const matches = profile.workModePreference === opportunity.workMode;
  return matches
    ? {
        ratio: 1,
        matched: [{
          label: "Work mode",
          detail: `${opportunity.workMode} matches your preferred work mode.`,
        }],
        missing: [],
      }
    : {
        ratio: 0,
        matched: [],
        missing: [{
          label: "Work mode",
          detail: `This listing is ${opportunity.workMode}; your profile prefers ${profile.workModePreference}.`,
        }],
      };
}
