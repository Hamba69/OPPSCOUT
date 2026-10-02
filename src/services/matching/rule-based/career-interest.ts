import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { DimensionScore } from "@/services/matching/rule-based/field-relevance";
import { normalize } from "@/services/matching/rule-based/normalize";

export function scoreCareerInterest(profile: UserProfile, opportunity: Opportunity): DimensionScore {
  const haystack = normalize(`${opportunity.category} ${opportunity.title} ${opportunity.description}`);
  const interests = [...profile.careerInterests, ...profile.opportunityCategories];
  const aligned = interests.filter((interest) => haystack.includes(normalize(interest)));
  return aligned.length
    ? {
        ratio: Math.min(0.5 + aligned.length * 0.25, 1),
        matched: [{
          label: "Career direction",
          detail: `Matches your selected interests/categories: ${aligned.join(", ")}.`,
        }],
        missing: [],
      }
    : {
        ratio: 0,
        matched: [],
        missing: [{
          label: "Career direction",
          detail: interests.length
            ? `Your interests (${interests.slice(0, 4).join(", ")}${interests.length > 4 ? "…" : ""}) do not strongly match this listing's category or description.`
            : "Add career interests or preferred opportunity categories on your profile to improve matching.",
        }],
      };
}
