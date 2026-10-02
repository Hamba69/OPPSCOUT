import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { DimensionScore } from "@/services/matching/rule-based/field-relevance";

export function scoreExperience(profile: UserProfile, opportunity: Opportunity): DimensionScore {
  const requiredMonths = opportunity.eligibility.minimumExperienceMonths ?? 0;
  const months = [...profile.workExperience, ...profile.internshipExperience].reduce(
    (sum, item) => sum + Math.max(item.months, 0),
    0,
  );
  if (requiredMonths === 0) {
    return {
      ratio: 1,
      matched: [{
        label: "Experience",
        detail: months
          ? `You have about ${months} months of recorded experience; this listing has no minimum experience gate.`
          : "No minimum experience is recorded on this listing.",
      }],
      missing: [],
    };
  }
  const ratio = Math.min(months / requiredMonths, 1);
  return months >= requiredMonths
    ? {
        ratio,
        matched: [{
          label: "Experience",
          detail: `Your ${months} months of experience meets the ${requiredMonths}-month baseline for this opportunity.`,
        }],
        missing: [],
      }
    : {
        ratio,
        matched: months
          ? [{
              label: "Relevant experience",
              detail: `You have ${months} months so far; the listing baselines at ${requiredMonths} months.`,
            }]
          : [],
        missing: [{
          label: "Experience gap",
          detail: `About ${requiredMonths - months} more months would meet the stated ${requiredMonths}-month baseline.`,
        }],
      };
}
