import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { DimensionScore } from "@/services/matching/rule-based/field-relevance";
import { includesNormalized } from "@/services/matching/rule-based/normalize";

export function scoreSkills(profile: UserProfile, opportunity: Opportunity): DimensionScore {
  const requirements = [
    ...opportunity.requiredSkills.map((skill) => ({ skill, importance: 2 })),
    ...opportunity.preferredSkills.map((skill) => ({ skill, importance: 1 })),
  ];
  if (!requirements.length) {
    return {
      ratio: 1,
      matched: [{
        label: "Skills",
        detail: profile.skills.length
          ? `Your profile skills (${profile.skills.slice(0, 4).join(", ")}${profile.skills.length > 4 ? "…" : ""}) are relevant; the listing does not list hard skill filters.`
          : "No specific skill requirements are recorded on this listing.",
      }],
      missing: [],
    };
  }
  const matched = requirements.filter(({ skill }) => includesNormalized(profile.skills, skill));
  const missing = requirements.filter(({ skill }) => !includesNormalized(profile.skills, skill));
  const total = requirements.reduce((sum, item) => sum + item.importance, 0);
  const earned = matched.reduce((sum, item) => sum + item.importance, 0);
  return {
    ratio: earned / total,
    matched: matched.length
      ? [{
          label: "Skills",
          detail: `Your profile includes ${matched.map((item) => item.skill).join(", ")}, which this listing asks for.`,
        }]
      : [],
    missing: missing.length
      ? [{
          label: "Skills to strengthen",
          detail: `To improve fit, add or develop: ${missing.map((item) => item.skill).join(", ")}.`,
        }]
      : [],
  };
}
