import { describe, expect, it } from "vitest";

import type { Opportunity } from "@/core/entities/domain";
import { buildReviewChecklist, checklistIsComplete, CHECKLIST_KEYS } from "@/services/trust/checklist";
import { classifySource, recheckIntervalDays } from "@/services/seeding/source-tiers";
import { candidateEligibility, candidateSchema, candidateToOpportunity } from "@/services/seeding/candidate";
import { runSeedingPipeline, type ExistingRecord } from "@/services/seeding/pipeline";
import { buildPersonas, computeCoverage } from "@/services/seeding/personas";
import { evaluateHardGates } from "@/services/matching/rule-based/hard-gates";
import { isUserVisibleOpportunity, visibilityFailures } from "@/services/trust/user-publication-policy";

const now = new Date("2026-11-11T09:00:00.000Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000).toISOString();

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    title: "Chevening Scholarship 2027/2028 (Uganda)",
    organizationName: "Chevening Secretariat",
    organizationOfficialDomain: "chevening.org",
    category: "scholarship",
    description: "Fully funded one-year master's scholarships in the United Kingdom for future leaders from Uganda with at least two years of work experience.",
    location: "United Kingdom",
    workMode: "onsite",
    requiredSkills: ["leadership"],
    eligibility: { minimumEducation: "bachelors", minimumExperienceMonths: 24, additionalRequirements: ["Return to Uganda for two years after the award."] },
    sourceUrl: "https://www.chevening.org/scholarships/uganda/",
    applicationUrl: "https://www.chevening.org/apply/",
    applicationInstructions: "Apply online through the official Chevening portal; no fee is charged.",
    leads: ["https://www.opportunitydesk.org/chevening-2027"],
    retrievedAt: days(0),
    deadlineType: "fixed",
    deadline: days(60),
    deadlineQuote: "Applications close at 12:00 GMT on 12 January 2027.",
    ugandanEligibility: "explicit",
    ugandanEligibilityQuote: "Uganda is one of the countries eligible to apply for a Chevening scholarship.",
    feeAssessment: "none",
    asksSensitiveDataOffPlatform: false,
    unresolved: [],
    ...overrides,
  };
}

const run = (records: unknown[], existing: ExistingRecord[] = []) => runSeedingPipeline(records, { now, existing });

describe("shared checklist", () => {
  it("builds a complete checklist only when every key is established", () => {
    const all = Object.fromEntries(CHECKLIST_KEYS.map((key) => [key, true])) as never;
    expect(checklistIsComplete(buildReviewChecklist(all))).toBe(true);
    expect(checklistIsComplete(buildReviewChecklist({ ...(all as object), eligibleForUgandans: false } as never))).toBe(false);
    expect(Object.keys(buildReviewChecklist({} as never))).toEqual([...CHECKLIST_KEYS]);
  });
});

describe("source tiers", () => {
  it("trusts the organisation's own domain and institutional suffixes", () => {
    expect(classifySource("https://www.chevening.org/apply", "chevening.org")).toMatchObject({ tier: "A", basis: "declared-official-domain" });
    expect(classifySource("https://jobs.au.int/job/1", "au.int")).toMatchObject({ tier: "A", basis: "known-official-suffix" });
    expect(classifySource("https://makerere.ac.ug/scholarships/x")).toMatchObject({ tier: "A" });
  });
  it("treats aggregators as Tier B and social platforms as Tier C, even when claimed as official", () => {
    expect(classifySource("https://www.opportunitydesk.org/chevening", "opportunitydesk.org").tier).toBe("B");
    expect(classifySource("https://reliefweb.int/job/123", "reliefweb.int").tier).toBe("B");
    expect(classifySource("https://t.me/ugandajobs/42", "t.me").tier).toBe("C");
    expect(classifySource("http://www.chevening.org/apply", "chevening.org").tier).toBe("C");
  });
  it("accepts an employer's own board on a hiring system only when the URL names the employer", () => {
    expect(classifySource("https://job-boards.greenhouse.io/oneacrefund/jobs/123", "oneacrefund.org", "One Acre Fund")).toMatchObject({ tier: "A", basis: "employer-ats-board" });
    expect(classifySource("https://oneacrefund.wd1.myworkdayjobs.com/en-US/careers/job/x", "oneacrefund.org", "One Acre Fund").tier).toBe("A");
    expect(classifySource("https://job-boards.greenhouse.io/someotherco/jobs/123", "oneacrefund.org", "One Acre Fund").tier).toBe("B");
    expect(classifySource("https://job-boards.greenhouse.io/oneacrefund/jobs/123", "oneacrefund.org").tier).toBe("B");
  });
  it("does not trust an unknown host that is not the declared domain", () => {
    expect(classifySource("https://random-scholarships.example/chevening", "chevening.org").tier).toBe("B");
  });
  it("re-checks vacancies more often than scholarships", () => {
    expect(recheckIntervalDays("job")).toBeLessThan(recheckIntervalDays("scholarship"));
  });
});

describe("seeding pipeline", () => {
  it("accepts a well-evidenced Tier A listing and reports the funnel", () => {
    const result = run([candidate()]);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0]).toMatchObject({ action: "insert" });
    expect(result.funnel.map((step) => step.remaining)).toEqual([1, 1, 1, 1, 1, 1, 1]);
  });

  it("expands a minimum education level to every level that qualifies", () => {
    const parsed = candidateSchema.parse(candidate());
    expect(candidateEligibility(parsed).educationLevels).toEqual(["bachelors", "masters", "phd"]);
  });

  it("holds a listing verified only against an aggregator, with the reason", () => {
    const result = run([candidate({ sourceUrl: "https://www.opportunitydesk.org/chevening-2027" })]);
    expect(result.accepted).toHaveLength(0);
    expect(result.held[0]).toMatchObject({ stage: "source" });
    expect(result.held[0].reasons.join(" ")).toMatch(/Tier B/);
  });

  it("accepts a listing verified on the employer's board on a hiring system, with a warning", () => {
    const result = run([candidate({ title: "Uganda Regional Data Coordinator", organizationName: "One Acre Fund", organizationOfficialDomain: "oneacrefund.org", category: "job", sourceUrl: "https://job-boards.greenhouse.io/oneacrefund/jobs/4001", applicationUrl: "https://job-boards.greenhouse.io/oneacrefund/jobs/4001" })]);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0].warnings.join(" ")).toMatch(/own board/);
  });

  it("holds social-media sources, homepages and aggregator application links", () => {
    expect(run([candidate({ sourceUrl: "https://t.me/ugandajobs/42" })]).held[0].reasons.join(" ")).toMatch(/Tier C/);
    expect(run([candidate({ sourceUrl: "https://www.chevening.org/" })]).held[0].reasons.join(" ")).toMatch(/homepage/);
    expect(run([candidate({ applicationUrl: "https://www.linkedin.com/jobs/view/1" })]).held[0].reasons.join(" ")).toMatch(/aggregator/);
  });

  it("holds anything the agent could not establish instead of guessing", () => {
    expect(run([candidate({ unresolved: ["Exact deadline time not stated"] })]).held[0].stage).toBe("evidence");
    expect(run([candidate({ ugandanEligibility: "unclear" })]).held[0].stage).toBe("evidence");
    expect(run([candidate({ feeAssessment: "suspicious" })]).held[0].stage).toBe("evidence");
    expect(run([candidate({ asksSensitiveDataOffPlatform: true })]).held[0].stage).toBe("evidence");
    expect(run([candidate({ retrievedAt: days(-10) })]).held[0].reasons.join(" ")).toMatch(/retrieved more than/);
  });

  it("rejects malformed records with readable reasons and never drops them silently", () => {
    const result = run([candidate({ deadline: "2027-01-12", deadlineQuote: "soon" }), { title: "x" }]);
    expect(result.accepted).toHaveLength(0);
    expect(result.held).toHaveLength(2);
    expect(result.held[0].reasons.join(" ")).toMatch(/timezone|quote/);
  });

  it("requires a fixed deadline with enough lead time and rejects implausible ones", () => {
    expect(run([candidate({ deadline: days(5) })]).held[0].reasons.join(" ")).toMatch(/minimum lead time/);
    expect(run([candidate({ deadline: days(900) })]).held[0].reasons.join(" ")).toMatch(/misread/);
    expect(run([candidate({ deadline: null })]).held[0].stage).toBe("schema");
  });

  it("accepts rolling listings, which have no deadline", () => {
    const rolling = candidate({ deadlineType: "rolling", deadline: null, deadlineQuote: "Applications are accepted on a rolling basis throughout the year." });
    expect(run([rolling]).accepted).toHaveLength(1);
  });

  it("catches duplicates inside a run and against the existing catalogue", () => {
    expect(run([candidate(), candidate()]).held[0].reasons.join(" ")).toMatch(/duplicate of record 0/);
    const existing: ExistingRecord = { id: "e1", title: "Other title", organizationId: "o", organizationName: "x", sourceUrl: "https://chevening.org/scholarships/uganda", deadline: new Date(days(60)), status: "open", verificationStatus: "verified" };
    expect(run([candidate()], [existing]).accepted[0]).toMatchObject({ action: "recheck", existingId: "e1" });
    expect(run([candidate({ deadline: days(90) })], [existing]).accepted[0]).toMatchObject({ action: "update-changed", existingId: "e1" });
    // An approved record with a partial checklist is invisible; a re-check must send it back through approval.
    expect(run([candidate()], [{ ...existing, checklistComplete: false }]).accepted[0]).toMatchObject({ action: "update-changed", existingId: "e1" });
    expect(run([candidate()], [{ ...existing, verificationStatus: "pending" }]).accepted[0]).toMatchObject({ action: "update-changed" });
    const sameTitle: ExistingRecord = { ...existing, id: "e2", title: "Chevening Scholarship 2027/2028 (Uganda)", organizationName: "Chevening Secretariat", sourceUrl: "https://other.example/x" };
    expect(run([candidate()], [sameTitle]).held[0].reasons.join(" ")).toMatch(/already live/);
    const expired: ExistingRecord = { ...sameTitle, status: "closed", deadline: new Date(days(-30)) };
    expect(run([candidate()], [expired]).accepted[0]).toMatchObject({ action: "update-changed", existingId: "e2" });
  });
});

describe("what the pipeline accepts is actually visible to seekers", () => {
  it("produces a verified record that passes the same gate the app uses", () => {
    const parsed = candidateSchema.parse(candidate());
    const record = candidateToOpportunity(parsed, { id: "id", organizationId: "org", now, reviewerId: "ops", verificationStatus: "verified" });
    expect(visibilityFailures(record, now)).toEqual([]);
    const staged = candidateToOpportunity(parsed, { id: "id", organizationId: "org", now, reviewerId: "pipeline", verificationStatus: "pending" });
    expect(isUserVisibleOpportunity(staged, now)).toBe(false);
    expect(checklistIsComplete(staged.reviewChecklist)).toBe(true);
  });
});

describe("rolling listings", () => {
  const parsed = candidateSchema.parse(candidate({ deadlineType: "rolling", deadline: null, deadlineQuote: "Applications are accepted on a rolling basis throughout the year." }));
  const record = (checkedAt: Date): Opportunity => ({ ...candidateToOpportunity(parsed, { id: "id", organizationId: "org", now, reviewerId: "ops", verificationStatus: "verified" }), checkedAt });
  it("is visible without a deadline while it has been re-checked recently", () => {
    expect(isUserVisibleOpportunity(record(now), now)).toBe(true);
  });
  it("disappears when it has not been re-checked, rather than showing indefinitely", () => {
    expect(visibilityFailures(record(new Date(now.getTime() - 20 * 86_400_000)), now)).toContain("rolling listing has not been re-checked recently");
  });
  it("never makes a fixed listing without a deadline visible", () => {
    expect(isUserVisibleOpportunity({ ...record(now), deadlineType: "fixed" }, now)).toBe(false);
  });
});

describe("programme rules the profile cannot express", () => {
  it("do not exclude every seeker; they become a confirm-with-provider note", () => {
    const [persona] = buildPersonas(now);
    const parsed = candidateSchema.parse(candidate());
    const record = candidateToOpportunity(parsed, { id: "id", organizationId: "org", now, reviewerId: "ops", verificationStatus: "verified" });
    const gated = { ...record, eligibility: { programmeRules: [{ field: "audience", label: "Proposed audience; confirm against the official source", allowedValues: ["confirm"] }] } } as unknown as Opportunity;
    const result = evaluateHardGates(persona.profile, gated);
    expect(result.eligible).toBe(true);
    expect(result.unverified.map((factor) => factor.label)).toContain("Confirm eligibility with provider");
  });
});

describe("persona coverage", () => {
  it("reports how many matches each typical seeker gets", async () => {
    const parsed = [
      candidate(),
      candidate({ title: "UNESCO Internship in Communication and Information", organizationName: "UNESCO", organizationOfficialDomain: "unesco.org", category: "internship", sourceUrl: "https://careers.unesco.org/job/intern-ci", applicationUrl: "https://careers.unesco.org/apply", eligibility: { minimumEducation: "bachelors" }, location: "Paris, France" }),
    ].map((raw) => candidateSchema.parse(raw));
    const opportunities = parsed.map((item, index) => candidateToOpportunity(item, { id: `id-${index}`, organizationId: "org", now, reviewerId: "ops", verificationStatus: "verified" }));
    const coverage = await computeCoverage(opportunities, { now, minMatches: 1 });
    expect(coverage).toHaveLength(8);
    expect(coverage.every((row) => row.visible === 2)).toBe(true);
    expect(coverage.find((row) => row.persona === "s6-leaver")?.eligible).toBe(0);
    expect(coverage.find((row) => row.persona === "mid-career")?.eligible).toBeGreaterThan(0);
  });
});
