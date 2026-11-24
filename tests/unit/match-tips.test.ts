import { describe, expect, it } from "vitest";

import type { Opportunity, UserProfile } from "@/core/entities/domain";
import { matchTips } from "@/services/profile/match-tips";

const profile = (overrides: Partial<UserProfile>): UserProfile => ({
  skills: ["excel"], fieldOfStudy: "statistics", educationLevel: "bachelors", opportunityCategories: ["job"], careerInterests: ["data"],
  location: "Gulu", preferredLocations: [], workExperience: [{ title: "Clerk", months: 6 }], internshipExperience: [], ...overrides,
}) as UserProfile;
const listing = (overrides: Partial<Opportunity>): Opportunity => ({ title: "Role", description: "", category: "job", location: "Kampala", requiredSkills: [], eligibility: {}, ...overrides }) as Opportunity;
const factors = (labels: string[]) => labels.map((label) => ({ label, detail: "" }));
/** A near miss in the person's lane: it shares their field. */
const miss = (labels: string[], opportunity: Partial<Opportunity>, matched = ["Related field"]) =>
  ({ score: 48, missingFactors: factors(labels), matchedFactors: factors(matched), opportunity: listing(opportunity) });

describe("tips for getting more matches are specific to the person", () => {
  it("names the skills their near matches ask for that they don't list", () => {
    const tips = matchTips(profile({}), [miss(["Skills"], { requiredSkills: ["Data analysis", "Report writing"] }), miss(["Skills"], { requiredSkills: ["Data analysis", "Excel"] })]);
    expect(tips[0]).toEqual({ text: "Add skills you have, like data analysis or report writing", href: "/profile#skills" });
  });

  it("compares their experience with what near matches want, ignoring senior roles out of reach", () => {
    const tips = matchTips(profile({}), [
      miss(["Experience gap"], { eligibility: { minimumExperienceMonths: 24 } }),
      miss(["Experience gap"], { eligibility: { minimumExperienceMonths: 24 } }),
      miss(["Experience gap"], { eligibility: { minimumExperienceMonths: 96 } }),
    ]);
    expect(tips[0]?.text).toBe("Add any jobs or internships you've left out: your profile shows 6 months, close matches want about 2 years");
    expect(matchTips(profile({}), [miss(["Experience gap"], { eligibility: { minimumExperienceMonths: 96 } })])).toEqual([]);
  });

  it("names the opportunity types, career areas and places they are missing", () => {
    const tips = matchTips(profile({}), [
      miss(["Opportunity type", "Location"], { category: "scholarship", title: "Health research scholarship", location: "Wakiso, Uganda" }),
      miss(["Opportunity type", "Career direction", "Location"], { category: "fellowship", title: "Health research fellowship", location: "Wakiso, Uganda" }),
      miss(["Opportunity type", "Career direction"], { category: "scholarship", title: "Research scholarship in health data" }),
    ]);
    expect(tips.map((tip) => tip.text)).toEqual([
      "Add Scholarships and Fellowships to the opportunity types you want, if you'd consider them",
      "Add research or health to your career interests, if they interest you",
      "Add Wakiso to places you'd work, or choose Anywhere in Uganda",
    ]);
  });

  it("never learns from listings outside their field, or from words that only appear in descriptions", () => {
    const offField = [
      miss(["Field of study", "Skills to strengthen"], { requiredSkills: ["process engineering", "process simulation"] }, ["Location"]),
      miss(["Skills to strengthen"], { requiredSkills: ["process engineering"] }, ["Location", "Opportunity type"]),
    ];
    expect(matchTips(profile({}), offField)).toEqual([]);
    const wordy = [1, 2].map(() => miss(["Career direction"], { title: "Software developer", description: "Health insurance and business hours apply." }));
    expect(matchTips(profile({}), wordy)).toEqual([]);
  });

  it("puts missing basics first, shows at most three, and stays quiet with nothing specific to say", () => {
    expect(matchTips(profile({ skills: [], fieldOfStudy: null, educationLevel: null }), [miss(["Location"], { location: "Wakiso" })]).map((tip) => tip.text))
      .toEqual(["Add your skills", "Add your field of study", "Add your education level"]);
    expect(matchTips(profile({}), [])).toEqual([]);
    expect(matchTips(profile({}), [miss(["Experience gap"], {})])).toEqual([]);
  });
});
