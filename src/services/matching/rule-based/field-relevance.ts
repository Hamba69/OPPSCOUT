import type { MatchFactor } from "@/core/interfaces/match-engine";
import type { Opportunity, UserProfile } from "@/core/entities/domain";
import { includesNormalized } from "@/services/matching/rule-based/normalize";

export interface DimensionScore {
  ratio: number;
  matched: MatchFactor[];
  missing: MatchFactor[];
}

export function scoreFieldRelevance(profile: UserProfile, opportunity: Opportunity): DimensionScore {
  const accepted = opportunity.eligibility.fieldsOfStudy ?? [];
  if (!accepted.length) {
    return {
      ratio: 1,
      matched: [{
        label: "Field of study",
        detail: profile.fieldOfStudy
          ? `Your field (${profile.fieldOfStudy}${profile.institution ? ` at ${profile.institution}` : ""}) is not restricted by this listing; still confirm official requirements.`
          : "No study-field restriction is recorded; check the official requirements.",
      }],
      missing: [],
    };
  }
  const matches = Boolean(profile.fieldOfStudy) && includesNormalized(accepted, profile.fieldOfStudy ?? "");
  return matches
    ? {
        ratio: 1,
        matched: [{
          label: "Field of study",
          detail: `Your ${profile.fieldOfStudy}${profile.institution ? ` (${profile.institution})` : ""} aligns with the accepted fields: ${accepted.join(", ")}.`,
        }],
        missing: [],
      }
    : {
        ratio: 0,
        matched: [],
        missing: [{
          label: "Field of study",
          detail: profile.fieldOfStudy
            ? `Your field is ${profile.fieldOfStudy}; this listing prioritises: ${accepted.join(", ")}.`
            : `Add your field of study. This listing prioritises: ${accepted.join(", ")}.`,
        }],
      };
}
