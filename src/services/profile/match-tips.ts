import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { MatchFactor } from "@/core/interfaces/match-engine";
import { ANYWHERE_IN_UGANDA, placeOf } from "@/data/uganda-locations";
import { inferExperience } from "@/services/matching/orbit/infer";
import { choiceLabel } from "@/services/profile/choices";

/** A near miss: a listing that scored close to, but under, the match bar. */
export interface NearMiss { score: number; missingFactors: MatchFactor[]; opportunity?: Opportunity }
export interface MatchTip { text: string; href: string }

/** People with fewer matches than this see tips for getting more. */
export const FEW_MATCHES = 3;
const MAX_TIPS = 3;
/** The career areas a profile can pick, as offered on the profile form. */
const CAREER_AREAS = ["technology", "data", "research", "social impact", "community development", "health", "agriculture", "finance", "business", "policy", "environment", "media", "education", "security"];

const lower = (value: string): string => value.trim().toLowerCase();
const words = (items: string[], joiner = "or"): string => items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} ${joiner} ${items[items.length - 1]}`;
const years = (months: number): string => months < 12 ? `${months} months` : `${Math.round(months / 6) / 2} year${months >= 18 ? "s" : ""}`;

/** The values near misses share that this profile lacks, most common first. */
function topCounts(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([value]) => value);
}

/** Near misses that were held back by this factor. */
const heldBackBy = (nearMisses: NearMiss[], ...labels: string[]): NearMiss[] =>
  nearMisses.filter((miss) => miss.missingFactors.some((factor) => labels.includes(factor.label)));

/**
 * Up to three short steps that would get this person more matches. Each names what is specific to them:
 * the skills, opportunity types, career areas or places that the listings they nearly matched ask for and
 * their profile lacks, or how much experience those listings want against what the profile shows. Steps are
 * ranked by how many near misses they would help, with missing basics first. A step with nothing specific
 * to say is left out. Never suggests adding things they do not have.
 */
export function matchTips(profile: UserProfile, nearMisses: NearMiss[]): MatchTip[] {
  const out: Array<{ weight: number; tip: MatchTip }> = [];

  // Missing basics: these hold back almost every listing.
  if (!profile.skills.length) out.push({ weight: 1000, tip: { text: "Add your skills", href: "/profile#skills" } });
  if (!profile.fieldOfStudy) out.push({ weight: 900, tip: { text: "Add your field of study", href: "/profile#education" } });
  if (!profile.educationLevel) out.push({ weight: 800, tip: { text: "Add your education level", href: "/profile#education" } });

  // Skills the near misses ask for that the profile does not list.
  const have = profile.skills.map(lower);
  if (profile.skills.length) {
    const asked = heldBackBy(nearMisses, "Skills", "Skills to strengthen", "Related skills")
      .flatMap((miss) => (miss.opportunity?.requiredSkills ?? []).map(lower))
      .filter((skill) => skill && !have.some((h) => h === skill || h.includes(skill) || skill.includes(h)));
    const skills = topCounts(asked, 3);
    if (skills.length) out.push({ weight: asked.length, tip: { text: `Add skills you have, like ${words(skills)}`, href: "/profile#skills" } });
  }

  // Experience: what the near misses want against what the profile shows.
  const experienceMisses = heldBackBy(nearMisses, "Experience gap", "Experience");
  const wanted = experienceMisses.map((miss) => miss.opportunity ? inferExperience(miss.opportunity)?.value.months ?? 0 : 0).filter((months) => months > 0).sort((a, b) => a - b);
  if (wanted.length) {
    const shown = [...profile.workExperience, ...profile.internshipExperience].reduce((sum, item) => sum + Math.max(item.months, 0), 0);
    const typical = wanted[Math.floor(wanted.length / 2)]!;
    if (typical > shown) out.push({ weight: experienceMisses.length, tip: {
      text: shown ? `Add any jobs or internships you've left out: your profile shows ${years(shown)}, close matches want about ${years(typical)}` : `Add your jobs and internships: close matches want about ${years(typical)} of experience`,
      href: "/profile#experience" } });
  }

  // Opportunity types the near misses are, which the profile has not chosen.
  const chosen = profile.opportunityCategories.map(lower);
  const types = heldBackBy(nearMisses, "Opportunity type").map((miss) => lower(miss.opportunity?.category ?? "")).filter((type) => type && !chosen.includes(type));
  const topTypes = topCounts(types, 2);
  if (topTypes.length) out.push({ weight: types.length, tip: { text: `Add ${words(topTypes.map(choiceLabel), "and")} to the opportunity types you want, if you'd consider them`, href: "/profile#preferences" } });

  // Career areas the near misses are about, which the profile has not chosen.
  const interests = profile.careerInterests.map(lower);
  const areaHits = heldBackBy(nearMisses, "Career direction").flatMap((miss) => {
    const text = lower(`${miss.opportunity?.title ?? ""} ${miss.opportunity?.description ?? ""}`);
    return CAREER_AREAS.filter((area) => !interests.includes(area) && new RegExp(`\\b${area}\\b`).test(text));
  });
  const areas = topCounts(areaHits, 2);
  if (areas.length) out.push({ weight: areaHits.length, tip: { text: `Add ${words(areas)} to your career interests, if they interest you`, href: "/profile#preferences" } });

  // Places the near misses are in, which the profile does not cover.
  if (!profile.preferredLocations.includes(ANYWHERE_IN_UGANDA)) {
    const covered = [profile.location ?? "", ...profile.preferredLocations].map(lower);
    const places = heldBackBy(nearMisses, "Location").flatMap((miss) => {
      const place = placeOf(miss.opportunity?.location);
      return place?.kind === "district" && !covered.includes(lower(place.name)) ? [place.name] : [];
    });
    const topPlaces = topCounts(places, 2);
    if (topPlaces.length) out.push({ weight: places.length, tip: { text: `Add ${words(topPlaces)} to places you'd work, or choose Anywhere in Uganda`, href: "/profile#preferences" } });
  }

  return out.sort((a, b) => b.weight - a.weight).slice(0, MAX_TIPS).map((item) => item.tip);
}
