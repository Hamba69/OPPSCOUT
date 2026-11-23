import { observeUnmatched } from "@/services/matching/telemetry";
import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { MatchEngine, MatchFactor, MatchResult } from "@/core/interfaces/match-engine";
import { orbitWeightsFor, type OrbitMatchingWeights } from "@/config/matching-weights";
import { canonicalPhrase, contentTokens, dice, FIELD_INDEX, isNationwide, locationSimilarity, SKILL_INDEX, trigrams } from "@/services/matching/orbit/canonical";
import { placeOf } from "@/data/uganda-locations";
import { choiceLabel } from "@/services/profile/choices";
import { educationLabel, educationRank, inferEducation, inferExperience, inferFields, inferSkills } from "@/services/matching/orbit/infer";

/**
 * 2.0.0: evidence-weighted scoring. v1 credited a listing 80-100% on any dimension it did not
 * describe, so thinly described listings scored identically (e.g. 71 or 88) for every seeker and the
 * only visible reason was location. v2 reads requirements out of the listing text, adds qualification
 * and opportunity-type fit, and treats anything still unknown as a neutral prior, never as a match.
 */
export const ORBIT_ENGINE_VERSION = "2.0.0";

export interface OrbitOptions {
  /** Concept orbits + token-boundary matching instead of substring. */
  canonical: boolean;
  /** Related-concept credit, typo snapping, location hierarchy, noisy-or interests. */
  soft: boolean;
  /** 0..1. Final score is multiplied by (1 - anchor) + anchor * competence, so a perfect location cannot carry an unqualified match. */
  anchor: number;
  /** Credit for a dimension neither the listing nor its text describes. Kept below 0.5 so "unknown" never looks like "good fit". */
  emptyPrior: number;
  weights?: (category: string) => OrbitMatchingWeights;
}

export const ORBIT_DEFAULTS: OrbitOptions = { canonical: true, soft: true, anchor: 0.25, emptyPrior: 0.35 };

type DimKey = "skills" | "fieldRelevance" | "education" | "experience" | "careerInterest" | "categoryFit" | "location" | "workMode";
/** ratio: how well the profile fits (0..1). evidence: how much the listing actually told us (0..1). */
interface Dim { ratio: number; evidence: number; matched: MatchFactor[]; missing: MatchFactor[]; }
const NONE = (missing: MatchFactor[] = []): Dim => ({ ratio: 0, evidence: 0, matched: [], missing });

const INTEREST_EXPANSIONS: Record<string, string[]> = {
  technology: ["software development", "javascript", "python", "it support", "computer science", "mobile development", "networking", "machine learning"],
  tech: ["software development", "javascript", "python", "it support", "computer science", "mobile development"],
  data: ["data analysis", "data management", "sql", "excel", "data science", "statistics", "machine learning"],
  "social impact": ["community engagement", "social sciences", "public health", "programme coordination", "innovation", "community health"],
  "community development": ["community engagement", "social sciences", "programme coordination", "community health"],
  health: ["public health", "patient care", "community health", "laboratory", "pharmacy"], agriculture: ["agriculture", "agronomy", "livestock", "agribusiness"],
  farming: ["agriculture", "agronomy", "livestock"], finance: ["finance", "bookkeeping", "financial modelling", "auditing", "banking", "tax"],
  business: ["business", "entrepreneurship", "sales", "marketing", "agribusiness"], policy: ["social sciences", "research", "report writing", "policy analysis"],
  research: ["research", "statistics", "data analysis"], environment: ["environment", "gis"], media: ["communications", "social media", "journalism", "photography and video"],
  education: ["education", "teaching"], security: ["cybersecurity", "networking"], law: ["law", "legal research"], trades: ["vocational trades", "construction", "electrical installation", "mechanics"],
  creative: ["arts and design", "graphic design", "photography and video"], hospitality: ["hospitality and tourism", "hospitality"],
};
const CATEGORY_ALIASES: Record<string, string> = { job: "job", jobs: "job", employment: "job", internship: "internship", internships: "internship", scholarship: "scholarship", scholarships: "scholarship", fellowship: "fellowship", fellowships: "fellowship", consultancy: "consultancy", consultancies: "consultancy", grant: "grant", grants: "grant", training: "training", trainings: "training", exhibition: "exhibition", exhibitions: "exhibition" };
const CATEGORY_NOUN: Record<string, string> = { job: "jobs", internship: "internships", scholarship: "scholarships", fellowship: "fellowships", consultancy: "consultancies", grant: "grants", training: "training", exhibition: "exhibitions" };

function normCategory(value: string): string { const key = canonicalPhrase(value); return CATEGORY_ALIASES[key] ?? CATEGORY_ALIASES[`${key}s`] ?? key; }
function list(items: string[], max = 3): string {
  const shown = items.slice(0, max);
  const tail = items.length > max ? ` and ${items.length - max} more` : "";
  return shown.length <= 1 ? `${shown.join("")}${tail}` : `${shown.slice(0, -1).join(", ")}${tail ? ", " : " and "}${shown.at(-1)}${tail}`;
}
function duration(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.round(months / 6) / 2;
  return `${years % 1 ? years.toFixed(1) : years} year${years === 1 ? "" : "s"}`;
}
function titleCase(value: string): string { return choiceLabel(value); }

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

/** Everything on a profile that can evidence a skill, not only the skills list. */
function skillPool(profile: UserProfile): string[] {
  return [...new Set([
    ...profile.skills, ...profile.certifications,
    ...profile.projects.flatMap((p) => p.tags),
    ...[...profile.workExperience, ...profile.internshipExperience].map((e) => e.title),
  ].map((s) => s.trim()).filter(Boolean))];
}

export class OrbitMatchEngine implements MatchEngine {
  private readonly o: OrbitOptions;
  public constructor(options: Partial<OrbitOptions> = {}) { this.o = { ...ORBIT_DEFAULTS, ...options }; }

  private skills(profile: UserProfile, opp: Opportunity): Dim {
    const need = inferSkills(opp);
    if (!need) return NONE();
    const pool = skillPool(profile);
    const names = need.value.map((r) => need.source === "inferred" ? titleCase(r.label) : r.label);
    if (!pool.length) return { ratio: 0.1, evidence: need.evidence, matched: [], missing: [{ label: "Skills", detail: `Add your skills. This listing looks for ${list(names)}.` }] };
    let earned = 0, total = 0;
    const strong: string[] = [], partial: string[] = [], lacking: string[] = [];
    need.value.forEach(({ label, weight }, i) => {
      const { score, via } = similarity(label, pool, SKILL_INDEX, this.o.soft, this.o.canonical);
      earned += weight * score; total += weight;
      if (score >= 0.85) strong.push(names[i]!); else if (score >= 0.3) partial.push(`${names[i]} (you list ${via})`); else lacking.push(names[i]!);
    });
    let ratio = earned / total;
    // Profile skills the description mentions even though they were not tagged: real but weaker signal.
    if (need.source === "listing" && this.o.canonical) {
      const text = canonicalPhrase(`${opp.title} ${opp.description}`);
      const mentioned = SKILL_INDEX.scan(text);
      const tagged = new Set(need.value.map((r) => SKILL_INDEX.resolve(r.label, this.o.soft)?.concept).filter(Boolean));
      const extra = pool.filter((s) => { const c = SKILL_INDEX.resolve(s, this.o.soft)?.concept; return c && !tagged.has(c) && mentioned.includes(c); });
      ratio = Math.min(1, ratio + 0.08 * Math.min(extra.length, 2));
      if (extra.length) partial.push(`${list(extra, 2)} (mentioned in the description)`);
    }
    const askVerb = need.source === "listing" ? "asks for" : "describes work using";
    const matched: MatchFactor[] = [];
    if (strong.length) matched.push({ label: "Skills", detail: `You bring ${list(strong)}, which this listing ${askVerb}.` });
    if (partial.length) matched.push({ label: "Related skills", detail: `Close to what it needs: ${partial.slice(0, 3).join("; ")}.` });
    const missing: MatchFactor[] = lacking.length ? [{ label: "Skills to strengthen", detail: `The listing also values ${list(lacking)}.` }] : [];
    return { ratio, evidence: need.evidence, matched, missing };
  }

  private field(profile: UserProfile, opp: Opportunity): Dim {
    const need = inferFields(opp);
    if (!need) return NONE();
    const fields = need.value.map((f) => need.source === "inferred" ? titleCase(f) : f);
    if (!profile.fieldOfStudy) return { ratio: 0.15, evidence: need.evidence, matched: [], missing: [{ label: "Field of study", detail: `Add your field of study. This listing is aimed at ${list(fields)}.` }] };
    let { score } = similarity(profile.fieldOfStudy, need.value, FIELD_INDEX, this.o.soft, this.o.canonical);
    if (score === 0 && !FIELD_INDEX.resolve(profile.fieldOfStudy, this.o.soft)) {
      // Field outside the vocabulary: fall back to plain word overlap with the listing text.
      const words = contentTokens(profile.fieldOfStudy);
      const text = new Set(contentTokens(`${opp.title} ${opp.description} ${need.value.join(" ")}`));
      if (words.length && words.filter((w) => text.has(w)).length / words.length >= 0.5) score = 0.7;
    }
    const focus = need.source === "listing" ? `accepts ${list(fields)}` : `focuses on ${list(fields)}`;
    if (score >= 0.85) return { ratio: 1, evidence: need.evidence, matched: [{ label: "Field of study", detail: `Your ${profile.fieldOfStudy} background fits: this listing ${focus}.` }], missing: [] };
    if (score >= 0.25) return { ratio: score, evidence: need.evidence, matched: [{ label: "Related field", detail: `${profile.fieldOfStudy} is related; this listing ${focus}.` }], missing: [] };
    return { ratio: 0, evidence: need.evidence, matched: [], missing: [{ label: "Field of study", detail: `This listing ${focus}; you studied ${profile.fieldOfStudy}.` }] };
  }

  private education(profile: UserProfile, opp: Opportunity): Dim {
    const need = inferEducation(opp);
    if (!need) return NONE();
    const have = educationRank(profile.educationLevel);
    const expects = educationLabel(need.value);
    if (have === null) return { ratio: 0.2, evidence: need.evidence, matched: [], missing: [{ label: "Qualification", detail: `Add your education level. This listing expects ${expects}.` }] };
    const gap = have - need.value;
    if (gap >= 0) return { ratio: 1, evidence: need.evidence, matched: [{ label: "Qualification", detail: `Your ${educationLabel(have).replace(/^an? /, "")} meets the level this listing expects (${expects}).` }], missing: [] };
    return { ratio: gap === -1 ? 0.3 : 0, evidence: need.evidence, matched: [], missing: [{ label: "Qualification", detail: `This listing expects ${expects}; your profile shows ${educationLabel(have)}.` }] };
  }

  private experience(profile: UserProfile, opp: Opportunity): Dim {
    const need = inferExperience(opp);
    if (!need) return NONE();
    const months = [...profile.workExperience, ...profile.internshipExperience].reduce((s, e) => s + Math.max(e.months, 0), 0);
    const { months: required, entryLevel } = need.value;
    if (entryLevel && required <= 12) {
      return months <= 36
        ? { ratio: 1, evidence: need.evidence, matched: [{ label: "Entry level", detail: months ? `An entry-level opening that suits your ${duration(months)} of experience.` : "An entry-level opening: no prior experience needed." }], missing: [] }
        : { ratio: 0.6, evidence: need.evidence, matched: [], missing: [{ label: "Experience", detail: `This is entry level; with ${duration(months)} of experience you may be more senior than needed.` }] };
    }
    if (required === 0) return NONE();
    const ratio = Math.min(months / required, 1);
    const phrase = need.source === "listing" ? `asks for ${duration(required)}` : `reads as needing about ${duration(required)}`;
    return months >= required
      ? { ratio, evidence: need.evidence, matched: [{ label: "Experience", detail: `Your ${duration(months)} of experience meets this role, which ${phrase}.` }], missing: [] }
      : { ratio: ratio ** 1.3, evidence: need.evidence, matched: [], missing: [{ label: "Experience gap", detail: `This role ${phrase} of experience; you have ${months ? duration(months) : "none recorded"}.` }] };
  }

  private location(profile: UserProfile, opp: Opportunity): Dim {
    const prefs = [profile.location ?? "", ...profile.preferredLocations].filter(Boolean);
    const remote = opp.workMode === "remote" || placeOf(opp.location)?.kind === "remote";
    if (remote) return { ratio: 1, evidence: 1, matched: [{ label: "Location", detail: "This can be done remotely." }], missing: [] };
    if (!prefs.length) return NONE([{ label: "Location", detail: "Add your location to sharpen this match." }]);
    // A listing that only says "Uganda" tells us little about the commute.
    const nationwide = isNationwide(opp.location);
    let best = 0;
    for (const p of prefs) {
      const s = this.o.soft ? locationSimilarity(p, opp.location) : (locationSimilarity(p, opp.location) === 1 ? 1 : 0);
      best = Math.max(best, s);
    }
    const evidence = nationwide ? 0.3 : 1;
    if (best >= 0.85) return { ratio: best, evidence, matched: [{ label: "Location", detail: nationwide ? "Open to applicants across Uganda." : `${opp.location} fits your location preferences.` }], missing: [] };
    if (best > 0) return { ratio: best, evidence, matched: [{ label: "Nearby location", detail: `${opp.location} is in reach of your preferred areas.` }], missing: [] };
    return { ratio: 0, evidence, matched: [], missing: [{ label: "Location", detail: `${opp.location} is outside your saved preferences.` }] };
  }

  private workMode(profile: UserProfile, opp: Opportunity): Dim {
    const pref = profile.workModePreference;
    if (opp.workMode === "unknown") return NONE();
    if (!pref) return NONE([{ label: "Work mode", detail: "Add a work-mode preference to sharpen this match." }]);
    if (pref === opp.workMode) return { ratio: 1, evidence: 1, matched: [{ label: "Work mode", detail: `${titleCase(opp.workMode)} matches your preference.` }], missing: [] };
    if (this.o.soft && (pref === "hybrid" || opp.workMode === "hybrid")) return { ratio: 0.5, evidence: 1, matched: [], missing: [{ label: "Work mode", detail: `This is ${opp.workMode}; you prefer ${pref}, which may still work.` }] };
    return { ratio: 0, evidence: 1, matched: [], missing: [{ label: "Work mode", detail: `This is ${opp.workMode}; you prefer ${pref}.` }] };
  }

  private categoryFit(profile: UserProfile, opp: Opportunity): Dim {
    const wanted = [...new Set(profile.opportunityCategories.map(normCategory))];
    if (!wanted.length) return NONE();
    const category = normCategory(opp.category);
    const noun = CATEGORY_NOUN[category] ?? category;
    return wanted.includes(category)
      ? { ratio: 1, evidence: 1, matched: [{ label: "Opportunity type", detail: `You asked to see ${noun}.` }], missing: [] }
      : { ratio: 0.1, evidence: 1, matched: [], missing: [{ label: "Opportunity type", detail: `This is a ${category} listing; you chose ${list(wanted.map((w) => CATEGORY_NOUN[w] ?? w))}.` }] };
  }

  private interest(profile: UserProfile, opp: Opportunity): Dim {
    const interests = profile.careerInterests;
    if (!interests.length) return NONE([{ label: "Career direction", detail: "Add career interests so we can rank listings by direction." }]);
    const rawText = `${opp.category} ${opp.title} ${opp.description}`;
    if (!this.o.canonical) {
      const hay = rawText.toLowerCase().replace(/[^a-z0-9]+/g, " ");
      const aligned = interests.filter((i) => hay.includes(i.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()));
      return aligned.length ? { ratio: Math.min(0.5 + aligned.length * 0.25, 1), evidence: 1, matched: [{ label: "Career direction", detail: `Connects with your interest in ${list(aligned)}.` }], missing: [] } : { ratio: 0, evidence: 1, matched: [], missing: [{ label: "Career direction", detail: "This sits outside your selected interests." }] };
    }
    const textPhrase = canonicalPhrase(rawText);
    const oppConcepts = new Set<string>([...SKILL_INDEX.scan(textPhrase), ...FIELD_INDEX.scan(textPhrase), ...opp.requiredSkills.concat(opp.preferredSkills).map((s) => SKILL_INDEX.resolve(s, true)?.concept ?? ""), ...(opp.eligibility.fieldsOfStudy ?? []).map((f) => FIELD_INDEX.resolve(f, true)?.concept ?? "")].filter(Boolean));
    const textTokens = new Set(contentTokens(rawText));
    const hits: string[] = [];
    let miss = 1;
    for (const interest of interests) {
      const key = canonicalPhrase(interest);
      let s = 0;
      const skill = SKILL_INDEX.resolve(interest, this.o.soft), field = FIELD_INDEX.resolve(interest, this.o.soft);
      const expanded = [...(INTEREST_EXPANSIONS[key] ?? []), ...(skill ? [skill.concept] : []), ...(field ? [field.concept] : [])];
      if (!expanded.length) observeUnmatched("interest", interest);
      if (expanded.length) {
        const overlap = expanded.filter((c) => oppConcepts.has(c)).length;
        if (overlap) s = Math.max(s, this.o.soft ? Math.min(0.55 + 0.15 * overlap, 1) : 1);
      }
      const toks = contentTokens(interest);
      if (toks.length) { const frac = toks.filter((t) => textTokens.has(t)).length / toks.length; if (frac >= 0.5) s = Math.max(s, frac * (this.o.soft ? 0.8 : 1)); }
      if (s > 0) { hits.push(interest); miss *= this.o.soft ? 1 - s : 0; }
    }
    if (!hits.length) return { ratio: 0, evidence: 1, matched: [], missing: [{ label: "Career direction", detail: `This sits outside your interests (${list(interests)}).` }] };
    return { ratio: this.o.soft ? 1 - miss : Math.min(0.5 + hits.length * 0.25, 1), evidence: 1, matched: [{ label: "Career direction", detail: `Connects with your interest in ${list(hits)}.` }], missing: [] };
  }

  public async score(profile: UserProfile, opp: Opportunity): Promise<MatchResult> { return this.scoreSync(profile, opp); }

  public scoreSync(profile: UserProfile, opp: Opportunity): MatchResult {
    const w = (this.o.weights ?? orbitWeightsFor)(opp.category);
    const dims: Record<DimKey, Dim> = {
      skills: this.skills(profile, opp), fieldRelevance: this.field(profile, opp), education: this.education(profile, opp),
      experience: this.experience(profile, opp), careerInterest: this.interest(profile, opp), categoryFit: this.categoryFit(profile, opp),
      location: this.location(profile, opp), workMode: this.workMode(profile, opp),
    };
    const prior = this.o.emptyPrior;
    const keys = (Object.keys(dims) as DimKey[]).filter((k) => w[k] > 0);
    const effective = (k: DimKey) => dims[k].evidence * dims[k].ratio + (1 - dims[k].evidence) * prior;
    const max = keys.reduce((s, k) => s + w[k], 0);
    const raw = keys.reduce((s, k) => s + w[k] * effective(k), 0) / max;
    const competenceKeys = (["skills", "fieldRelevance", "education", "experience"] as const).filter((k) => w[k] > 0);
    const competenceMax = competenceKeys.reduce((s, k) => s + w[k], 0);
    const competence = competenceMax ? competenceKeys.reduce((s, k) => s + w[k] * effective(k), 0) / competenceMax : 1;
    const gated = raw * ((1 - this.o.anchor) + this.o.anchor * competence);

    // Strongest real evidence first, so the card's one-line reason is the one that moved the score most.
    const matched = [...keys].sort((a, b) => w[b] * dims[b].evidence * dims[b].ratio - w[a] * dims[a].evidence * dims[a].ratio).flatMap((k) => dims[k].matched);
    const missing = [...keys].sort((a, b) => w[b] * Math.max(dims[b].evidence, 0.2) * (1 - dims[b].ratio) - w[a] * Math.max(dims[a].evidence, 0.2) * (1 - dims[a].ratio)).flatMap((k) => dims[k].missing);
    const coverage = keys.reduce((s, k) => s + w[k] * dims[k].evidence, 0) / max;
    if (coverage < 0.35) missing.push({ label: "Limited listing detail", detail: "The listing states few requirements, so this score is an estimate. Check the full listing before applying." });
    return { score: Math.max(0, Math.min(100, Math.round(gated * 100))), matchedFactors: matched, missingFactors: missing, generatedBy: "rules" };
  }
}
