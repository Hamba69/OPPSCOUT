export const RULES_ENGINE_VERSION = "1.0.0";
import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { MatchEngine, MatchResult } from "@/core/interfaces/match-engine";
import { matchingWeightsFor } from "@/config/matching-weights";
import { scoreCareerInterest } from "@/services/matching/rule-based/career-interest";
import { scoreExperience } from "@/services/matching/rule-based/experience";
import { scoreFieldRelevance } from "@/services/matching/rule-based/field-relevance";
import { scoreLocation } from "@/services/matching/rule-based/location";
import { scoreSkills } from "@/services/matching/rule-based/skills";
import { scoreWorkMode } from "@/services/matching/rule-based/work-mode";

export class RuleBasedMatchEngine implements MatchEngine {
  public async score(profile: UserProfile, opportunity: Opportunity): Promise<MatchResult> {
    const weights = matchingWeightsFor(opportunity.category);
    const dimensions = [
      { weight: weights.fieldRelevance, value: scoreFieldRelevance(profile, opportunity) },
      { weight: weights.skills, value: scoreSkills(profile, opportunity) },
      { weight: weights.experience, value: scoreExperience(profile, opportunity) },
      { weight: weights.location, value: scoreLocation(profile, opportunity) },
      { weight: weights.workMode, value: scoreWorkMode(profile, opportunity) },
      { weight: weights.careerInterest, value: scoreCareerInterest(profile, opportunity) },
    ].filter((item) => item.weight > 0);
    const raw = dimensions.reduce((sum, item) => sum + item.weight * item.value.ratio, 0);
    const matchedFactors = dimensions.flatMap((item) => item.value.matched);
    const missingFactors = dimensions.flatMap((item) => item.value.missing);
    const maximumWeight = dimensions.reduce((sum, item) => sum + item.weight, 0);
    return {
      score: Math.max(0, Math.min(100, Math.round((raw / maximumWeight) * 100))),
      matchedFactors,
      missingFactors,
      generatedBy: "rules",
    };
  }
}
