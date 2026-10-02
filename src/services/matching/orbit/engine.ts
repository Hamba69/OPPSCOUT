import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { MatchEngine, MatchFactor, MatchResult } from "@/core/interfaces/match-engine";
import { matchingWeightsFor, type MatchingWeights } from "@/config/matching-weights";
import { canonicalPhrase, contentTokens, dice, FIELD_INDEX, locationSimilarity, SKILL_INDEX, trigrams } from "@/services/matching/orbit/canonical";

export interface OrbitOptions {
  /** V1: concept orbits + token-boundary matching instead of substring. */
  canonical: boolean;
  /** V2: related-concept credit, typo snapping, location hierarchy, noisy-or interests. */
  soft: boolean;
  /** 0..1. Final score is multiplied by (1 - anchor) + anchor * anchorRatio (skills+field blend). Simulation showed larger values trade recall for precision without improving ranking. */
  anchor: number;
  /** Credit for an opportunity that lists no skills / no field limits. 1 reproduces the baseline. */
  emptyPrior: number;
  weights?: (category: string) => MatchingWeights;
}

export const ORBIT_DEFAULTS: OrbitOptions = { canonical: true, soft: true, anchor: 0.1, emptyPrior: 0.8 };

interface Dim { ratio: number; matched: MatchFactor[]; missing: MatchFactor[]; }

const INTEREST_EXPANSIONS: Record<string, string[]> = {
  technology: ["software development", "javascript", "python", "it support", "computer science"],
  tech: ["software development", "javascript", "python", "it support", "computer science"],
  data: ["data analysis", "data management", "sql", "excel", "data science"],
  "social impact": ["community engagement", "social sciences", "public health", "programme coordination"],
  "community development": ["community engagement", "social sciences", "programme coordination"],
  health: ["public health"], agriculture: ["agriculture", "agronomy"], farming: ["agriculture", "agronomy"],
  finance: ["finance", "bookkeeping", "financial modelling"], business: ["business", "entrepreneurship"],
  policy: ["social sciences", "research", "report writing"], research: ["research"], environment: ["environment"],
  media: ["communications", "social media"], education: ["education"], security: ["cybersecurity"],
};
const CATEGORY_ALIASES: Record<string, string> = { job: "job", jobs: "job", employment: "job", internship: "internship", internships: "internship", scholarship: "scholarship", scholarships: "scholarship", fellowship: "fellowship", fellowships: "fellowship", consultancy: "consultancy" };

function similarity(label: string, pool: string[], index: typeof SKILL_INDEX, soft: boolean, canonical: boolean): { score: number; via: string | null } {
  if (!canonical) {
    const target = label.trim().toLowerCase();
    const hit = pool.find((p) => { const c = p.trim().toLowerCase(); return c === target || c.includes(target) || target.includes(c); });
    return hit ? { score: 1, via: hit } : { score: 0, via: null };
  }
  const want = index.resolve(label, soft);
  const phrase = canonicalPhrase(label);
  const wantGrams = trigrams(phrase);
  let best = { score: 0, via: null as string | null };
  for (const candidate of pool) {
    const have = index.resolve(candidate, soft);
    let s = 0;
    if (want && have) s = (soft ? index.relation(want.concept, have.concept) : want.concept === have.concept ? 1 : 0) * Math.min(want.confidence, have.confidence);
    else if (!want && !have) {
      const cp = canonicalPhrase(candidate);
      if (cp === phrase) s = 1;
      else if (soft) { const d = dice(wantGrams, trigrams(cp)); s = d >= 0.8 ? d * 0.85 : 0; }
    }
    if (s > best.score) best = { score: s, via: candidate };
  }
  return best;
}

export class OrbitMatchEngine implements MatchEngine {
  private readonly o: OrbitOptions;
  public constructor(options: Partial<OrbitOptions> = {}) { this.o = { ...ORBIT_DEFAULTS, ...options }; }

  private skills(profile: UserProfile, opp: Opportunity): Dim {
    const reqs = [...opp.requiredSkills.map((skill) => ({ skill, w: 2 })), ...opp.preferredSkills.map((skill) => ({ skill, w: 1 }))];
    if (!reqs.length) return { ratio: this.o.emptyPrior, matched: [{ label: "Skills", detail: "No specific skill requirements are recorded." }], missing: [] };
    let earned = 0, total = 0;
    const strong: string[] = [], partial: string[] = [], lacking: string[] = [];
    for (const { skill, w } of reqs) {
      const { score, via } = similarity(skill, profile.skills, SKILL_INDEX, this.o.soft, this.o.canonical);
      earned += w * score; total += w;
      if (score >= 0.85) strong.push(skill); else if (score >= 0.3) partial.push(`${skill} (you list ${via})`); else lacking.push(skill);
    }
    const matched: MatchFactor[] = [];
    if (strong.length) matched.push({ label: "Skills", detail: `You bring ${strong.join(", ")}.` });
    if (partial.length) matched.push({ label: "Related skills", detail: `Close to ${partial.join("; ")}.` });
    return { ratio: earned / total, matched, missing: lacking.length ? [{ label: "Skills to strengthen", detail: `The listing also values ${lacking.join(", ")}.` }] : [] };
  }

  private field(profile: UserProfile, opp: Opportunity): Dim {
    const accepted = opp.eligibility.fieldsOfStudy ?? [];
    if (!accepted.length) return { ratio: this.o.emptyPrior, matched: [{ label: "Field of study", detail: "No study-field restriction is recorded; check the official requirements." }], missing: [] };
    if (!profile.fieldOfStudy) return { ratio: this.o.soft ? 0.3 : 0, matched: [], missing: [{ label: "Field of study", detail: "Add your field of study to sharpen this match." }] };
    const { score } = similarity(profile.fieldOfStudy, accepted, FIELD_INDEX, this.o.soft, this.o.canonical);
    if (score >= 0.85) return { ratio: 1, matched: [{ label: "Field of study", detail: `${profile.fieldOfStudy} aligns with the opportunity.` }], missing: [] };
    if (score >= 0.3) return { ratio: score, matched: [{ label: "Related field", detail: `${profile.fieldOfStudy} is close to ${accepted.join(", ")}.` }], missing: [] };
    return { ratio: 0, matched: [], missing: [{ label: "Field of study", detail: `Strongest alignment: ${accepted.join(", ")}.` }] };
  }

  private experience(profile: UserProfile, opp: Opportunity): Dim {
    const required = opp.eligibility.minimumExperienceMonths ?? 0;
    const months = [...profile.workExperience, ...profile.internshipExperience].reduce((s, e) => s + Math.max(e.months, 0), 0);
    if (required === 0) return { ratio: 1, matched: [{ label: "Experience", detail: "No minimum experience is recorded." }], missing: [] };
    const ratio = Math.min(months / required, 1);
    return months >= required
      ? { ratio, matched: [{ label: "Experience", detail: `${months} months meets the ${required}-month baseline.` }], missing: [] }
      : { ratio, matched: months ? [{ label: "Relevant experience", detail: `${months} months will still support your application.` }] : [], missing: [{ label: "Experience gap", detail: `${required - months} more months would meet the stated baseline.` }] };
  }

  private location(profile: UserProfile, opp: Opportunity): Dim {
    const prefs = [profile.location ?? "", ...profile.preferredLocations].filter(Boolean);
    const remote = opp.workMode === "remote" || canonicalPhrase(opp.location) === "remote";
    if (remote) return { ratio: 1, matched: [{ label: "Location", detail: "This can be done remotely." }], missing: [] };
    if (!prefs.length) return { ratio: this.o.soft ? 0.5 : 0, matched: [], missing: [{ label: "Location", detail: "Add your location to sharpen this match." }] };
    let best = 0;
    for (const p of prefs) {
      const s = this.o.soft ? locationSimilarity(p, opp.location) : (canonicalPhrase(p) === canonicalPhrase(opp.location) || canonicalPhrase(opp.location) === "uganda" ? 1 : 0);
      best = Math.max(best, s);
    }
    if (best >= 0.85) return { ratio: best, matched: [{ label: "Location", detail: `${opp.location} fits your location preferences.` }], missing: [] };
    if (best > 0) return { ratio: best, matched: [{ label: "Nearby location", detail: `${opp.location} is in reach of your preferred areas.` }], missing: [] };
    return { ratio: 0, matched: [], missing: [{ label: "Location", detail: `${opp.location} is outside your saved preferences.` }] };
  }

  private workMode(profile: UserProfile, opp: Opportunity): Dim {
    const pref = profile.workModePreference;
    if (!pref) return { ratio: 0.5, matched: [], missing: [{ label: "Work mode", detail: "Add a work-mode preference to sharpen this match." }] };
    if (pref === opp.workMode) return { ratio: 1, matched: [{ label: "Work mode", detail: `${opp.workMode} matches your preference.` }], missing: [] };
    if (this.o.soft && (pref === "hybrid" || opp.workMode === "hybrid")) return { ratio: 0.5, matched: [{ label: "Work mode", detail: `${opp.workMode} is flexible enough for your ${pref} preference.` }], missing: [] };
    return { ratio: 0, matched: [], missing: [{ label: "Work mode", detail: `This is ${opp.workMode}; you prefer ${pref}.` }] };
  }

  private interest(profile: UserProfile, opp: Opportunity): Dim {
    const interests = [...profile.careerInterests, ...profile.opportunityCategories];
    const rawText = `${opp.category} ${opp.title} ${opp.description}`;
    if (!this.o.canonical) {
      const hay = rawText.toLowerCase().replace(/[^a-z0-9]+/g, " ");
      const aligned = interests.filter((i) => hay.includes(i.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()));
      return aligned.length ? { ratio: Math.min(0.5 + aligned.length * 0.25, 1), matched: [{ label: "Career direction", detail: `Connects with ${aligned.join(", ")}.` }], missing: [] } : { ratio: 0, matched: [], missing: [{ label: "Career direction", detail: "This sits outside your selected interests." }] };
    }
    const textPhrase = canonicalPhrase(rawText);
    const oppConcepts = new Set<string>([...SKILL_INDEX.scan(textPhrase), ...FIELD_INDEX.scan(textPhrase), ...opp.requiredSkills.concat(opp.preferredSkills).map((s) => SKILL_INDEX.resolve(s, true)?.concept ?? ""), ...(opp.eligibility.fieldsOfStudy ?? []).map((f) => FIELD_INDEX.resolve(f, true)?.concept ?? "")].filter(Boolean));
    const textTokens = new Set(contentTokens(rawText));
    const hits: string[] = [];
    let miss = 1;
    for (const interest of interests) {
      const key = canonicalPhrase(interest);
      let s = 0;
      if (CATEGORY_ALIASES[key] === opp.category.toLowerCase()) s = 1;
      const expanded = [...(INTEREST_EXPANSIONS[key] ?? []), ...(SKILL_INDEX.resolve(interest, this.o.soft) ? [SKILL_INDEX.resolve(interest, this.o.soft)!.concept] : []), ...(FIELD_INDEX.resolve(interest, this.o.soft) ? [FIELD_INDEX.resolve(interest, this.o.soft)!.concept] : [])];
      if (expanded.length) {
        const overlap = expanded.filter((c) => oppConcepts.has(c)).length;
        if (overlap) s = Math.max(s, this.o.soft ? Math.min(0.55 + 0.15 * overlap, 1) : 1);
      }
      const toks = contentTokens(interest);
      if (toks.length) { const frac = toks.filter((t) => textTokens.has(t)).length / toks.length; if (frac >= 0.5) s = Math.max(s, frac * (this.o.soft ? 0.8 : 1)); }
      if (s > 0) { hits.push(interest); miss *= this.o.soft ? 1 - s : 0; }
    }
    if (!hits.length) return { ratio: 0, matched: [], missing: [{ label: "Career direction", detail: "This sits outside your selected interests." }] };
    return { ratio: this.o.soft ? 1 - miss : Math.min(0.5 + hits.length * 0.25, 1), matched: [{ label: "Career direction", detail: `Connects with ${hits.join(", ")}.` }], missing: [] };
  }

  public async score(profile: UserProfile, opp: Opportunity): Promise<MatchResult> { return this.scoreSync(profile, opp); }

  public scoreSync(profile: UserProfile, opp: Opportunity): MatchResult {
    const w = (this.o.weights ?? matchingWeightsFor)(opp.category);
    const dims = {
      field: this.field(profile, opp), skills: this.skills(profile, opp), experience: this.experience(profile, opp),
      location: this.location(profile, opp), workMode: this.workMode(profile, opp), interest: this.interest(profile, opp),
    };
    const max = w.fieldRelevance + w.skills + w.experience + w.location + w.workMode + w.careerInterest;
    const raw = w.fieldRelevance * dims.field.ratio + w.skills * dims.skills.ratio + w.experience * dims.experience.ratio + w.location * dims.location.ratio + w.workMode * dims.workMode.ratio + w.careerInterest * dims.interest.ratio;
    // Anchor: competence signals (skills, field) gate the free dimensions so that a perfect commute cannot carry an unqualified match.
    const anchorRatio = (w.skills * dims.skills.ratio + w.fieldRelevance * dims.field.ratio) / (w.skills + w.fieldRelevance);
    const gated = (raw / max) * ((1 - this.o.anchor) + this.o.anchor * anchorRatio);
    const all = Object.values(dims);
    const matched = all.flatMap((d) => d.matched), missing = all.flatMap((d) => d.missing);
    if (!matched.length) matched.push({ label: "Eligibility", detail: "You passed the mandatory eligibility checks against your profile." });
    if (!missing.length) missing.push({ label: "Application readiness", detail: "Your profile aligns well. Confirm required documents on the official source and tailor your application before submitting." });
    return { score: Math.max(0, Math.min(100, Math.round(gated * 100))), matchedFactors: matched, missingFactors: missing, generatedBy: "rules" };
  }
}
