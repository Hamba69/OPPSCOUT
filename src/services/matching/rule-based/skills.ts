import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { DimensionScore } from "@/services/matching/rule-based/field-relevance";
import { includesNormalized } from "@/services/matching/rule-based/normalize";

export function scoreSkills(profile: UserProfile, opportunity: Opportunity): DimensionScore {
  const requirements = [
    ...opportunity.requiredSkills.map((skill) => ({ skill, importance: 2 })),
    ...opportunity.preferredSkills.map((skill) => ({ skill, importance: 1 })),
  ];
  if (!requirements.length) return { ratio: 1, matched: [{ label: "Skills", detail: "No specific skills are required." }], missing: [] };
  const matched = requirements.filter(({ skill }) => includesNormalized(profile.skills, skill));
  const missing = requirements.filter(({ skill }) => !includesNormalized(profile.skills, skill));
  const total = requirements.reduce((sum, item) => sum + item.importance, 0);
  const earned = matched.reduce((sum, item) => sum + item.importance, 0);
  return {
    ratio: earned / total,
    matched: matched.length ? [{ label: "Skills", detail: `You bring ${matched.map((item) => item.skill).join(", ")}.` }] : [],
    missing: missing.length ? [{ label: "Skills to strengthen", detail: `The listing also values ${missing.map((item) => item.skill).join(", ")}.` }] : [],
  };
}
