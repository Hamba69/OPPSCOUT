import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { MatchFactor } from "@/core/interfaces/match-engine";

/** A near miss: a listing that scored close to, but under, the match bar. */
export interface NearMiss { score: number; missingFactors: MatchFactor[]; opportunity?: Opportunity }
export interface MatchTip { text: string; href: string }

/** People with fewer matches than this see tips for getting more. */
export const FEW_MATCHES = 3;
const MAX_TIPS = 3;

const lower = (value: string): string => value.trim().toLowerCase();

/** Skills that near-miss listings ask for and the profile does not list, most asked-for first. */
function wantedSkills(profile: UserProfile, nearMisses: NearMiss[]): string[] {
  const have = profile.skills.map(lower);
  const counts = new Map<string, { label: string; count: number }>();
  for (const miss of nearMisses) {
    for (const skill of miss.opportunity?.requiredSkills ?? []) {
      const key = lower(skill);
      if (!key || have.some((h) => h === key || h.includes(key) || key.includes(h))) continue;
      const entry = counts.get(key) ?? { label: skill.trim(), count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 3).map((item) => item.label.toLowerCase());
}

/**
 * Up to three short, specific steps that would get this person more matches: the gaps that cost them most
 * across the listings they nearly matched, then obvious gaps in the profile itself. Each links to the
 * profile section that fixes it. Never suggests adding things they do not have.
 */
export function matchTips(profile: UserProfile, nearMisses: NearMiss[]): MatchTip[] {
  const cost = new Map<string, number>();
  for (const miss of nearMisses) for (const factor of miss.missingFactors) cost.set(factor.label, (cost.get(factor.label) ?? 0) + 1);
  const skills = wantedSkills(profile, nearMisses);

  const candidates: Array<{ key: string; weight: number; tip: MatchTip | null }> = [
    { key: "skills", weight: (cost.get("Skills") ?? 0) + (cost.get("Skills to strengthen") ?? 0) + (profile.skills.length ? 0 : 100),
      tip: !profile.skills.length ? { text: "Add your skills", href: "/profile#skills" }
        : skills.length ? { text: `Add skills you have, like ${skills.join(", ")}`, href: "/profile#skills" } : null },
    { key: "field", weight: (cost.get("Field of study") ?? 0) + (profile.fieldOfStudy ? 0 : 90),
      tip: !profile.fieldOfStudy ? { text: "Add your field of study", href: "/profile#education" } : null },
    { key: "education", weight: (cost.get("Qualification") ?? 0) + (profile.educationLevel ? 0 : 80),
      tip: !profile.educationLevel ? { text: "Add your education level", href: "/profile#education" } : null },
    { key: "experience", weight: (cost.get("Experience gap") ?? 0) + (cost.get("Experience") ?? 0),
      tip: { text: "Add your jobs and internships, with how long each lasted", href: "/profile#experience" } },
    { key: "types", weight: (cost.get("Opportunity type") ?? 0) + (profile.opportunityCategories.length ? 0 : 70),
      tip: { text: profile.opportunityCategories.length ? "Choose more opportunity types you'd consider" : "Choose the opportunity types you want", href: "/profile#preferences" } },
    { key: "interests", weight: (cost.get("Career direction") ?? 0) + (profile.careerInterests.length ? 0 : 60),
      tip: { text: profile.careerInterests.length ? "Add other career areas you're interested in" : "Add the career areas you're interested in", href: "/profile#preferences" } },
    { key: "places", weight: (cost.get("Location") ?? 0) + (cost.get("Work mode") ?? 0),
      tip: { text: "Add more places you'd work, or choose Anywhere in Uganda", href: "/profile#preferences" } },
  ];
  return candidates
    .filter((item) => item.weight > 0 && item.tip)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_TIPS)
    .map((item) => item.tip!);
}
