// Reads requirements out of a listing when the structured fields are empty. Most catalogue rows carry a
// rich title and description but few structured tags (only ~6% list fields of study), so without this the
// engine treats "not recorded" as "no requirement" and every thin listing scores the same for everyone.
// Every inference carries an evidence weight below 1 so explicit data always outranks guesses.

import type { Opportunity } from "@/core/entities/domain";
import { canonicalPhrase, FIELD_INDEX, SKILL_INDEX } from "@/services/matching/orbit/canonical";
import { SKILL_TO_FIELD } from "@/services/matching/orbit/ontology";

export const EDUCATION_LEVELS = ["no formal education", "secondary", "certificate", "diploma", "bachelors", "masters", "phd"] as const;
const LEVEL_LABEL = ["no formal education", "secondary school", "a certificate", "a diploma", "a bachelor's degree", "a master's degree", "a PhD"];

/** Ordinal index for a profile or listing education value; null when unknown. */
export function educationRank(value: string | null | undefined): number | null {
  if (!value) return null;
  const v = canonicalPhrase(value);
  if (/\b(phd|doctorate|doctoral)\b/.test(v)) return 6;
  if (/\b(master|msc|ma|mba|postgraduate)\b/.test(v)) return 5;
  if (/\b(bachelor|degree|undergraduate|bsc|ba|graduate)\b/.test(v)) return 4;
  if (/\bdiploma\b/.test(v)) return 3;
  if (/\bcertificate\b/.test(v)) return 2;
  if (/\b(secondary|o level|a level|uce|uace|senior)\b/.test(v)) return 1;
  if (/\b(no formal|none|primary)\b/.test(v)) return 0;
  return null;
}
export function educationLabel(rank: number): string { return LEVEL_LABEL[Math.max(0, Math.min(6, rank))]!; }

export interface Inferred<T> { value: T; evidence: number; source: "listing" | "inferred" }

const STUDY_CATEGORIES = new Set(["scholarship", "fellowship"]);
function text(opp: Opportunity): string { return `${opp.title}. ${opp.description}`; }
function normCategory(category: string): string { return category.trim().toLowerCase().replace(/s$/, ""); }

/** Minimum education the listing expects, as a rank. */
export function inferEducation(opp: Opportunity): Inferred<number> | null {
  const explicit = (opp.eligibility.educationLevels ?? []).map(educationRank).filter((r): r is number => r !== null);
  if (explicit.length) return { value: Math.min(...explicit), evidence: 1, source: "listing" };
  const category = normCategory(opp.category);
  const title = canonicalPhrase(opp.title), body = canonicalPhrase(text(opp));
  if (STUDY_CATEGORIES.has(category)) {
    // A scholarship *for* a master's needs a bachelor's first, and so on.
    const level = /\b(phd|doctoral|doctorate)\b/.test(title) && !/\bmaster\b/.test(title) ? 5
      : /\bmaster\b/.test(title) || /\bpostgraduate\b/.test(title) ? 4
      : /\b(undergraduate|bachelor)\b/.test(title) ? 1 : null;
    return level === null ? null : { value: level, evidence: 0.7, source: "inferred" };
  }
  if (category === "grant") return null;
  const patterns: Array<[RegExp, number]> = [
    [/\b(phd|doctorate) (is )?required\b/, 6],
    [/\bmaster ?s? degree\b|\bmasters? in\b|\bpostgraduate (degree|qualification)\b/, 5],
    [/\bbachelor|\bdegree (in|holder)\b|\b(relevant|university|undergraduate|first) degree\b|\bfinal year (university )?student/, 4],
    [/\bdiploma\b/, 3],
    [/\bcertificate in\b|\bnational certificate\b/, 2],
    [/\b(o level|a level|uce|uace|senior four|senior six|s4|s6)\b/, 1],
  ];
  // Listings often say "diploma or degree": take the lowest level they mention.
  const found = patterns.filter(([re]) => re.test(body)).map(([, rank]) => rank);
  return found.length ? { value: Math.min(...found), evidence: 0.6, source: "inferred" } : null;
}

export interface ExperienceNeed { months: number; entryLevel: boolean }
const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

/** Experience the listing expects, from explicit months, "N years of experience" text, or title seniority. */
export function inferExperience(opp: Opportunity): Inferred<ExperienceNeed> | null {
  const explicit = opp.eligibility.minimumExperienceMonths;
  const category = normCategory(opp.category);
  const title = canonicalPhrase(opp.title), body = canonicalPhrase(text(opp));
  const entryLevel = category === "internship" || /\b(intern|internship|trainee|apprentice|entry level|junior|graduate trainee|volunteer|attachment)\b/.test(title);
  if (explicit !== undefined && explicit > 0) return { value: { months: explicit, entryLevel }, evidence: 1, source: "listing" };
  if (["scholarship", "grant", "training"].includes(category)) return explicit === 0 ? { value: { months: 0, entryLevel: true }, evidence: 0.5, source: "listing" } : null;
  const numeric = body.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/g, (w) => String(NUMBER_WORDS[w]));
  const years = [...numeric.matchAll(/\b(\d{1,2})(?: (?:to )?\d{1,2})?(?: plus| or more)? year (?:of )?(?:(?:relevant|professional|progressive|post|qualification|work|working|practical|proven|hands|on|demonstrated|related) )*experience/g)].map((m) => Number(m[1])).filter((n) => n > 0 && n <= 25);
  if (years.length) return { value: { months: Math.min(...years) * 12, entryLevel: entryLevel && Math.min(...years) <= 1 }, evidence: 0.85, source: "inferred" };
  if (entryLevel) return { value: { months: 0, entryLevel: true }, evidence: 0.7, source: "inferred" };
  if (/\b(director|head of|chief|principal|country manager|regional manager)\b/.test(title)) return { value: { months: 96, entryLevel: false }, evidence: 0.6, source: "inferred" };
  if (/\b(senior|manager|lead|specialist|expert|advisor|adviser)\b/.test(title)) return { value: { months: 48, entryLevel: false }, evidence: 0.55, source: "inferred" };
  if (/\b(officer|associate|coordinator|analyst|accountant|engineer)\b/.test(title)) return { value: { months: 18, entryLevel: false }, evidence: 0.35, source: "inferred" };
  return null;
}

// Aliases too generic to signal a requirement when they appear inside prose.
const PROSE_NOISE = new Set(["management", "planning", "organization", "writing", "documentation", "monitoring", "evaluation", "outreach", "accounts", "collaboration", "media", "business", "communication", "research", "leadership", "teamwork", "innovation", "problem solving"]);

function scanProse(index: typeof SKILL_INDEX, phrase: string): string[] {
  const tokens = phrase.split(" ");
  return index.scan(phrase).filter((concept) => {
    // Keep a generic concept only if it appears in a longer, specific alias, not as a lone word.
    if (!PROSE_NOISE.has(concept)) return true;
    return tokens.filter((t) => t === concept).length >= 2;
  });
}

/** Skill concepts the listing asks for; tagged skills first, otherwise read from the text. */
export function inferSkills(opp: Opportunity): Inferred<Array<{ label: string; weight: number }>> | null {
  const tagged = [...opp.requiredSkills.map((label) => ({ label, weight: 2 })), ...opp.preferredSkills.map((label) => ({ label, weight: 1 }))];
  if (tagged.length) return { value: tagged, evidence: 1, source: "listing" };
  const concepts = scanProse(SKILL_INDEX, canonicalPhrase(text(opp))).slice(0, 8);
  return concepts.length ? { value: concepts.map((label) => ({ label, weight: 1 })), evidence: Math.min(0.35 + 0.1 * concepts.length, 0.65), source: "inferred" } : null;
}

/** Field concepts the listing is aimed at: stated fields, else fields named in the text or implied by its skills. */
export function inferFields(opp: Opportunity): Inferred<string[]> | null {
  const stated = opp.eligibility.fieldsOfStudy ?? [];
  if (stated.length) return { value: stated, evidence: 1, source: "listing" };
  const phrase = canonicalPhrase(text(opp));
  const fromText = scanProse(FIELD_INDEX, phrase);
  const skillLabels = [...opp.requiredSkills, ...opp.preferredSkills];
  const skillConcepts = skillLabels.length ? skillLabels.map((s) => SKILL_INDEX.resolve(s, true)?.concept).filter((c): c is string => Boolean(c)) : scanProse(SKILL_INDEX, phrase);
  const fromSkills = skillConcepts.map((c) => SKILL_TO_FIELD[c]).filter((f): f is string => Boolean(f));
  const all = [...new Set([...fromText, ...fromSkills])];
  if (!all.length) return null;
  // Text that names many unrelated fields ("open to all disciplines") is weak evidence of any one of them.
  return { value: all, evidence: all.length > 4 ? 0.3 : 0.55, source: "inferred" };
}
