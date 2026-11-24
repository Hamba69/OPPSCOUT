import { describe, expect, it } from "vitest";

import type { Opportunity, UserProfile } from "@/core/entities/domain";
import { matchTips } from "@/services/profile/match-tips";

const profile = (overrides: Partial<UserProfile>): UserProfile => ({
  skills: ["excel"], fieldOfStudy: "statistics", educationLevel: "bachelors", opportunityCategories: ["job"], careerInterests: ["data"], ...overrides,
}) as UserProfile;
const miss = (labels: string[], requiredSkills: string[] = []) => ({ score: 48, missingFactors: labels.map((label) => ({ label, detail: "" })), opportunity: { requiredSkills } as unknown as Opportunity });

describe("tips for getting more matches", () => {
  it("names the skills nearly-matched listings ask for, most asked-for first", () => {
    const tips = matchTips(profile({}), [miss(["Skills"], ["Data analysis", "Report writing"]), miss(["Skills"], ["Data analysis", "Excel"]), miss(["Experience gap"])]);
    expect(tips[0]).toEqual({ text: "Add skills you have, like data analysis, report writing", href: "/profile#skills" });
    expect(tips[1]?.href).toBe("/profile#experience");
  });

  it("puts missing basics first, and shows at most three", () => {
    const tips = matchTips(profile({ skills: [], fieldOfStudy: null, educationLevel: null, opportunityCategories: [] }), [miss(["Location"])]);
    expect(tips.map((tip) => tip.text)).toEqual(["Add your skills", "Add your field of study", "Add your education level"]);
  });

  it("gives nothing when there is nothing useful to say", () => {
    expect(matchTips(profile({}), [])).toEqual([]);
  });
});
