import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { DimensionScore } from "@/services/matching/rule-based/field-relevance";
import { normalize } from "@/services/matching/rule-based/normalize";

export function scoreCareerInterest(profile: UserProfile, opportunity: Opportunity): DimensionScore {
  const haystack = normalize(`${opportunity.category} ${opportunity.title} ${opportunity.description}`);
  const interests = [...profile.careerInterests, ...profile.opportunityCategories];
  const aligned = interests.filter((interest) => haystack.includes(normalize(interest)));
  return aligned.length
    ? { ratio: Math.min(0.5 + aligned.length * 0.25, 1), matched: [{ label: "Career direction", detail: `Connects with ${aligned.join(", ")}.` }], missing: [] }
    : { ratio: 0, matched: [], missing: [{ label: "Career direction", detail: "This sits outside your selected interests." }] };
}
