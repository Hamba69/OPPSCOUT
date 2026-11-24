import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { MatchFactor } from "@/core/interfaces/match-engine";
import { ANYWHERE_IN_UGANDA, placeOf } from "@/data/uganda-locations";
import { inferExperience } from "@/services/matching/orbit/infer";
import { choiceLabel } from "@/services/profile/choices";

/** A near miss: a listing that scored close to, but under, the match bar. */
export interface NearMiss { score: number; missingFactors: MatchFactor[]; matchedFactors?: MatchFactor[]; opportunity?: Opportunity }
export interface MatchTip { text: string; href: string }

/** People with fewer matches than this see tips for getting more. */
export const FEW_MATCHES = 3;
const MAX_TIPS = 3;
/** The career areas a profile can pick, as offered on the profile form. */
const CAREER_AREAS = ["technology", "data", "research", "social impact", "community development", "health", "agriculture", "finance", "business", "policy", "environment", "media", "education", "security"];

const lower = (value: string): string => value.trim().toLowerCase();
const words = (items: string[], joiner = "or"): string => items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} ${joiner} ${items[items.length - 1]}`;
const years = (months: number): string => months < 12 ? `${months} months` : `${Math.round(months / 6) / 2} year${months >= 18 ? "s" : ""}`;

/** A skill as written in a sentence: lower case, but acronyms such as IT or SQL keep their capitals. */
const SKILL_ACRONYMS = new Set(["it", "sql", "ict", "hr", "gis", "ui", "ux", "seo", "crm", "erp", "aws", "api", "m&e", "mel"]);
const displaySkill = (skill: string): string => skill.split(" ").map((word) => SKILL_ACRONYMS.has(word) ? word.toUpperCase() : word).join(" ");

/** The values near misses share that this profile lacks, most common first. */
function topCounts(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([value]) => value);
}

/** Evidence that a listing connects to the person's own background, not just their location or chosen types. */
const LANE_SIGNALS = ["Field of study", "Skills"];
/** Experience gaps bigger than this are a matter of time, not a missing profile entry, so they are not suggested. */
const REACHABLE_GAP_MONTHS = 24;

/**
 * A near miss in this person's lane: it does not ask for a different field, and it either fits their field of
 * study outright or asks for a skill they already have. A merely related field or a shared broad interest is
 * not enough (a junior process engineer role is "related" to computer science and is "technology", but says
 * nothing about what a computer scientist should add), and neither is coming close on location or type.
 */
const inLane = (miss: NearMiss): boolean =>
  !miss.missingFactors.some((factor) => factor.label === "Field of study")
  && (miss.matchedFactors ?? []).some((factor) => LANE_SIGNALS.includes(factor.label));

/** In-lane near misses that were held back by this factor. */
const heldBackBy = (nearMisses: NearMiss[], ...labels: string[]): NearMiss[] =>
  nearMisses.filter((miss) => inLane(miss) && miss.missingFactors.some((factor) => labels.includes(factor.label)));

/**
 * Up to three short prompts that could get this person more matches. Each names what is specific to them:
 * the skills, opportunity types, career areas or places that listings they nearly matched ask for and their
 * profile lacks. Ranked by how many near misses each would help, with missing basics first. Only near misses in
 * the person's lane count (see inLane). A prompt with nothing specific to say is left out.
 *
 * Every prompt is a question the person answers honestly ("Do you have…?", "Open to…?"), never an instruction
 * to meet a listing's bar: it must not push anyone to claim a skill, experience or preference they do not have.
 * Experience in particular is never compared with what listings want; the prompt only checks nothing real was
 * left out.
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
    const skills = topCounts(asked, 3).map(displaySkill);
    if (skills.length) out.push({ weight: asked.length, tip: { text: `Do you have ${words(skills)}? If so, add them to your skills`, href: "/profile#skills" } });
  }

  // Experience: what the near misses want against what the profile shows.
  const experienceMisses = heldBackBy(nearMisses, "Experience gap", "Experience");
  const wanted = experienceMisses.map((miss) => miss.opportunity ? inferExperience(miss.opportunity)?.value.months ?? 0 : 0).filter((months) => months > 0);
  const shown = [...profile.workExperience, ...profile.internshipExperience].reduce((sum, item) => sum + Math.max(item.months, 0), 0);
  const reachable = wanted.filter((months) => months - shown <= REACHABLE_GAP_MONTHS).sort((a, b) => a - b);
  if (reachable.length) {
    const typical = reachable[Math.floor(reachable.length / 2)]!;
    if (typical > shown) out.push({ weight: reachable.length, tip: {
      text: shown ? `Have more jobs, internships or volunteer work than the ${years(shown)} on your profile? Add them` : "Done any jobs, internships or volunteer work? Add them, with how long each lasted",
      href: "/profile#experience" } });
  }

  // Opportunity types the near misses are, which the profile has not chosen.
  const chosen = profile.opportunityCategories.map(lower);
  const types = heldBackBy(nearMisses, "Opportunity type").map((miss) => lower(miss.opportunity?.category ?? "")).filter((type) => type && !chosen.includes(type));
  const topTypes = topCounts(types, 2);
  if (topTypes.length) out.push({ weight: types.length, tip: { text: `Open to ${words(topTypes.map(choiceLabel))}? Add them to the types you want`, href: "/profile#preferences" } });

  // Career areas the near misses are about, which the profile has not chosen.
  const interests = profile.careerInterests.map(lower);
  const areasByListing = heldBackBy(nearMisses, "Career direction").map((miss) => {
    const text = lower(miss.opportunity?.title ?? "");
    return CAREER_AREAS.filter((area) => !interests.includes(area) && new RegExp(`\\b${area}\\b`).test(text));
  });
  const areaHits = areasByListing.flat();
  // Titles only, and named by at least two listings: descriptions mention "business" or "health" in passing.
  const areas = topCounts(areaHits, 4).filter((area) => areaHits.filter((hit) => hit === area).length >= 2).slice(0, 2);
  if (areas.length) out.push({ weight: areasByListing.filter((found) => found.some((area) => areas.includes(area))).length, tip: { text: `Interested in ${words(areas)}? Add ${areas.length > 1 ? "them" : "it"} to your career interests`, href: "/profile#preferences" } });

  // Places the near misses are in, which the profile does not cover.
  if (!profile.preferredLocations.includes(ANYWHERE_IN_UGANDA)) {
    const covered = [profile.location ?? "", ...profile.preferredLocations].map(lower);
    const places = heldBackBy(nearMisses, "Location").flatMap((miss) => {
      const place = placeOf(miss.opportunity?.location);
      return place?.kind === "district" && !covered.includes(lower(place.name)) ? [place.name] : [];
    });
    const topPlaces = topCounts(places, 2);
    if (topPlaces.length) out.push({ weight: places.length, tip: { text: `Open to working in ${words(topPlaces)}? Add ${topPlaces.length > 1 ? "them" : "it"} to places you'd work`, href: "/profile#preferences" } });
  }

  return out.sort((a, b) => b.weight - a.weight).slice(0, MAX_TIPS).map((item) => item.tip);
}
