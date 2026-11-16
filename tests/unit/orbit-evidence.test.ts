import { describe, expect, it } from "vitest";

import type { Opportunity, UserProfile } from "@/core/entities/domain";
import { OrbitMatchEngine } from "@/services/matching/orbit/engine";
import { educationRank, inferEducation, inferExperience, inferSkills } from "@/services/matching/orbit/infer";

const opp = (o: Partial<Opportunity>): Opportunity => ({
  id: "o", title: "Listing", organizationId: null, category: "job", description: "", eligibility: {}, requiredSkills: [], preferredSkills: [],
  location: "Kampala", workMode: "onsite", deadline: null, applicationMethod: "", sourceUrl: "https://example.org", verificationStatus: "verified",
  source: "scraped", publicationDate: new Date(), checkedAt: new Date(), status: "open", reviewChecklist: {}, reviewNotes: null, reviewerId: null, reviewedAt: null, ...o,
});
const person = (p: Partial<UserProfile>): UserProfile => ({
  id: "u", name: "U", phone: null, email: null, preferredChannel: "web", secondaryChannels: [], notificationsEnabled: false, notificationFrequency: "weekly",
  educationLevel: null, institution: null, fieldOfStudy: null, graduationStatus: null, dateOfBirth: null, skills: [], workExperience: [], internshipExperience: [],
  certifications: [], location: "Kampala", preferredLocations: [], careerInterests: [], opportunityCategories: [], workModePreference: null, languages: ["English"],
  githubUrl: null, portfolioUrl: null, otherLinks: [], projects: [], shareWithOrganizations: false, shareContactDetails: false, orgSharingConsentAt: null,
  orgSharingConsentVersion: null, profileCompletenessScore: 0, createdAt: new Date(), updatedAt: new Date(), ...p,
});

const developer = person({ educationLevel: "bachelors", fieldOfStudy: "Computer Science", skills: ["JavaScript", "SQL"], careerInterests: ["Technology"], opportunityCategories: ["job"], workModePreference: "onsite" });
const nurse = person({ educationLevel: "diploma", fieldOfStudy: "Nursing", skills: ["Patient care"], careerInterests: ["Health"], opportunityCategories: ["job"], workExperience: [{ title: "Nurse", months: 24 }] });
const engine = new OrbitMatchEngine();

describe("OrbitMatch v2 evidence scoring", () => {
  it("does not give a thin listing the same high score for everyone", () => {
    const thin = opp({ title: "Rapid Response Grants", category: "grant", description: "Funding for projects." });
    const a = engine.scoreSync(developer, thin).score, b = engine.scoreSync(nurse, thin).score, empty = engine.scoreSync(person({}), thin).score;
    expect(Math.max(a, b, empty)).toBeLessThan(50);
    expect(engine.scoreSync(person({}), thin).missingFactors.map((f) => f.label)).toContain("Limited listing detail");
  });

  it("separates the right candidate from the wrong one on the same listing", () => {
    const devJob = opp({ title: "Junior Software Developer", description: "Build web apps with JavaScript and SQL. Bachelor's degree in Computer Science required." });
    const nurseJob = opp({ title: "Enrolled Nurse", description: "Provide patient care at a health centre. Diploma in Nursing and 2 years of experience." });
    expect(engine.scoreSync(developer, devJob).score - engine.scoreSync(nurse, devJob).score).toBeGreaterThan(30);
    expect(engine.scoreSync(nurse, nurseJob).score - engine.scoreSync(developer, nurseJob).score).toBeGreaterThan(30);
  });

  it("gives an ideal, fully described match a high score and explains it with skills first", () => {
    const ideal = opp({ title: "Software Developer", requiredSkills: ["JavaScript", "SQL"], eligibility: { educationLevels: ["bachelors"], fieldsOfStudy: ["Computer Science"] } });
    const result = engine.scoreSync(developer, ideal);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.matchedFactors[0]?.label).toBe("Skills");
  });

  it("ranks relevant listings well clear of unrelated ones", () => {
    const listings = ["Data Analyst", "Accountant", "Teacher", "Electrician", "Software Engineer", "Sales Associate", "Nurse", "Agronomist"].map((title, i) =>
      opp({ id: String(i), title, description: `We seek a ${title.toLowerCase()} with ${i + 1} years of experience in ${["SQL and Excel", "bookkeeping", "lesson planning", "electrical wiring", "JavaScript", "customer service", "patient care", "crop management"][i]}.` }));
    const scores = listings.map((l) => engine.scoreSync(developer, l).score);
    const relevant = [scores[0]!, scores[4]!], unrelated = scores.filter((_, i) => i !== 0 && i !== 4);
    expect(Math.min(...relevant)).toBeGreaterThan(Math.max(...unrelated) + 10);
  });

  it("penalises a senior role for a fresh graduate", () => {
    const senior = opp({ title: "Senior Software Engineer", description: "JavaScript and SQL. 6 years of experience required." });
    const junior = opp({ title: "Junior Software Engineer", description: "JavaScript and SQL." });
    expect(engine.scoreSync(developer, junior).score).toBeGreaterThan(engine.scoreSync(developer, senior).score);
  });

  it("reads requirements out of listing text", () => {
    expect(educationRank("bachelors")).toBe(4);
    expect(inferEducation(opp({ description: "Diploma or degree in accounting." }))?.value).toBe(3);
    expect(inferEducation(opp({ category: "scholarship", title: "Commonwealth Master's Scholarships" }))?.value).toBe(4);
    expect(inferExperience(opp({ description: "At least three years of relevant experience." }))?.value.months).toBe(36);
    expect(inferExperience(opp({ title: "Finance Intern", category: "internship" }))?.value.entryLevel).toBe(true);
    expect(inferSkills(opp({ description: "Strong Excel and bookkeeping skills." }))?.value.map((s) => s.label)).toEqual(expect.arrayContaining(["excel", "bookkeeping"]));
  });

});
