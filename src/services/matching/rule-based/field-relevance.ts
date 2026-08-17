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
  if (!accepted.length) return { ratio: 1, matched: [{ label: "Field of study", detail: "Open to all study fields." }], missing: [] };
  const matches = Boolean(profile.fieldOfStudy) && includesNormalized(accepted, profile.fieldOfStudy ?? "");
  return matches
    ? { ratio: 1, matched: [{ label: "Field of study", detail: `${profile.fieldOfStudy} aligns with the opportunity.` }], missing: [] }
    : { ratio: 0, matched: [], missing: [{ label: "Field of study", detail: `Strongest alignment: ${accepted.join(", ")}.` }] };
}
