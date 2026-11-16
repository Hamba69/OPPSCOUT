/**
 * Score-distribution diagnostic. Runs the active match engine against the catalogue snapshot
 * for a set of realistic seeker profiles and prints, per profile, the score spread and the
 * reasons shown. Usage: npx tsx scripts/sim/diagnose-scores.ts [--all] [--json]
 */
import { readFileSync } from "node:fs";

import type { Opportunity, UserProfile } from "@/core/entities/domain";
import { evaluateHardGates } from "@/services/matching/rule-based/hard-gates";
import { OrbitMatchEngine } from "@/services/matching/orbit/engine";

const snapshot = JSON.parse(readFileSync("docs/audits/catalog-snapshot.json", "utf8")) as { opportunities: Array<Record<string, unknown>> };
const includeAll = process.argv.includes("--all");

function toOpportunity(r: Record<string, unknown>): Opportunity {
  const d = (v: unknown) => (typeof v === "string" ? new Date(v) : null);
  return { ...(r as unknown as Opportunity), deadline: d(r.deadline), publicationDate: d(r.publicationDate) ?? new Date(), checkedAt: d(r.checkedAt) ?? new Date(), reviewedAt: d(r.reviewedAt), eligibility: (r.eligibility ?? {}) as Opportunity["eligibility"], requiredSkills: (r.requiredSkills ?? []) as string[], preferredSkills: (r.preferredSkills ?? []) as string[] };
}

const opportunities = snapshot.opportunities
  .filter((r) => includeAll || r.verificationStatus !== "flagged")
  .map(toOpportunity);

function profile(p: Partial<UserProfile> & { name: string }): UserProfile {
  return { id: p.name, phone: null, email: null, preferredChannel: "web", secondaryChannels: [], notificationsEnabled: false, notificationFrequency: "weekly", educationLevel: null, institution: null, fieldOfStudy: null, graduationStatus: null, dateOfBirth: null, skills: [], workExperience: [], internshipExperience: [], certifications: [], location: "Kampala", preferredLocations: [], careerInterests: [], opportunityCategories: [], workModePreference: null, languages: ["English"], githubUrl: null, portfolioUrl: null, otherLinks: [], projects: [], shareWithOrganizations: false, shareContactDetails: false, orgSharingConsentAt: null, orgSharingConsentVersion: null, profileCompletenessScore: 0, createdAt: new Date(), updatedAt: new Date(), ...p };
}

export const PROFILES: UserProfile[] = [
  profile({ name: "CS graduate, Kampala", educationLevel: "bachelors", fieldOfStudy: "Computer Science", graduationStatus: "graduated", dateOfBirth: new Date("2001-03-01"), skills: ["JavaScript", "Python", "SQL", "React"], internshipExperience: [{ title: "Software intern", months: 4 }], careerInterests: ["Technology", "Data"], opportunityCategories: ["job", "internship"], workModePreference: "hybrid" }),
  profile({ name: "Nursing diploma, Gulu", location: "Gulu", educationLevel: "diploma", fieldOfStudy: "Nursing", graduationStatus: "graduated", dateOfBirth: new Date("1999-07-11"), skills: ["Patient care", "Community health", "Record keeping"], workExperience: [{ title: "Enrolled nurse", months: 18 }], careerInterests: ["Health"], opportunityCategories: ["job", "training"], workModePreference: "onsite" }),
  profile({ name: "Agriculture student, Mbarara", location: "Mbarara", educationLevel: "bachelors", fieldOfStudy: "Agriculture", graduationStatus: "final year", dateOfBirth: new Date("2003-01-20"), skills: ["Agronomy", "Data collection", "Excel"], careerInterests: ["Agriculture", "Social impact"], opportunityCategories: ["internship", "scholarship", "grant"], workModePreference: "onsite" }),
  profile({ name: "Accountant, Kampala", educationLevel: "bachelors", fieldOfStudy: "Accounting", graduationStatus: "graduated", dateOfBirth: new Date("1995-05-05"), skills: ["Bookkeeping", "Financial reporting", "QuickBooks", "Excel"], certifications: ["CPA"], workExperience: [{ title: "Accounts assistant", months: 48 }], careerInterests: ["Finance"], opportunityCategories: ["job"], workModePreference: "onsite" }),
  profile({ name: "Senior 6 leaver, Jinja", location: "Jinja", educationLevel: "secondary", graduationStatus: "graduated", dateOfBirth: new Date("2006-09-09"), skills: ["Customer service", "Tailoring"], careerInterests: ["Business"], opportunityCategories: ["training", "grant"], workModePreference: null }),
  profile({ name: "Sparse profile (only location)", educationLevel: null, skills: [] }),
];

async function main(): Promise<void> {
  const engine = new OrbitMatchEngine();
  const rows: unknown[] = [];
  for (const p of PROFILES) {
    const scored = [];
    for (const o of opportunities) {
      const gates = evaluateHardGates(p, o);
      if (!gates.eligible) continue;
      const r = await engine.score(p, o);
      scored.push({ title: o.title, category: o.category, score: r.score, reasons: r.matchedFactors.map((f) => f.label), missing: r.missingFactors.map((f) => f.label) });
    }
    scored.sort((a, b) => b.score - a.score);
    const scores = scored.map((s) => s.score);
    const distinct = new Set(scores).size;
    const reasonCounts: Record<string, number> = {};
    for (const s of scored.slice(0, 10)) for (const r of s.reasons) reasonCounts[r] = (reasonCounts[r] ?? 0) + 1;
    const top10 = scores.slice(0, 10);
    const summary = { profile: p.name, eligible: scored.length, distinctScores: distinct, top10, min: Math.min(...scores), max: Math.max(...scores), top10Reasons: reasonCounts, sample: scored.slice(0, 3) };
    rows.push(summary);
    if (!process.argv.includes("--json")) {
      console.log(`\n=== ${p.name}: ${scored.length} eligible, ${distinct} distinct scores, range ${summary.min}-${summary.max}`);
      console.log(`  top10: ${top10.join(", ")}`);
      console.log(`  reasons in top10: ${JSON.stringify(reasonCounts)}`);
      for (const s of scored.slice(0, 5)) console.log(`   ${s.score}  [${s.category}] ${s.title.slice(0, 60)}  ✓${s.reasons.join("|")}`);
    }
  }
  if (process.argv.includes("--json")) console.log(JSON.stringify(rows, null, 2));
}

void main();
