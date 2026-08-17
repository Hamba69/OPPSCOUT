import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { DimensionScore } from "@/services/matching/rule-based/field-relevance";

export function scoreWorkMode(profile: UserProfile, opportunity: Opportunity): DimensionScore {
  if (!profile.workModePreference) return { ratio: 0.5, matched: [], missing: [{ label: "Work mode", detail: "Add a work-mode preference to sharpen this match." }] };
  const matches = profile.workModePreference === opportunity.workMode;
  return matches
    ? { ratio: 1, matched: [{ label: "Work mode", detail: `${opportunity.workMode} matches your preference.` }], missing: [] }
    : { ratio: 0, matched: [], missing: [{ label: "Work mode", detail: `This is ${opportunity.workMode}; you prefer ${profile.workModePreference}.` }] };
}
