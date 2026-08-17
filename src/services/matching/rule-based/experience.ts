import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { DimensionScore } from "@/services/matching/rule-based/field-relevance";

export function scoreExperience(profile: UserProfile, opportunity: Opportunity): DimensionScore {
  const requiredMonths = opportunity.eligibility.minimumExperienceMonths ?? 0;
  const months = [...profile.workExperience, ...profile.internshipExperience].reduce((sum, item) => sum + Math.max(item.months, 0), 0);
  if (requiredMonths === 0) return { ratio: 1, matched: [{ label: "Experience", detail: "No minimum experience is required." }], missing: [] };
  const ratio = Math.min(months / requiredMonths, 1);
  return months >= requiredMonths
    ? { ratio, matched: [{ label: "Experience", detail: `${months} months meets the ${requiredMonths}-month baseline.` }], missing: [] }
    : { ratio, matched: months ? [{ label: "Relevant experience", detail: `${months} months will still support your application.` }] : [], missing: [{ label: "Experience gap", detail: `${requiredMonths - months} more months would meet the stated baseline.` }] };
}
