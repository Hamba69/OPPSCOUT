import { describe, expect, it } from "vitest";

import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { profileSchema } from "@/lib/validation";
import { calculateProfileCompleteness, getIncompleteProfileFields } from "@/services/profile/completeness";

describe("profile enrichment", () => {
  it("normalizes valid GitHub URLs and rejects unsafe or non-GitHub URLs", () => {
    expect(profileSchema.parse({ githubUrl: "https://github.com/octocat/" }).githubUrl).toBe("https://github.com/octocat");
    expect(profileSchema.safeParse({ githubUrl: "http://github.com/octocat" }).success).toBe(false);
    expect(profileSchema.safeParse({ githubUrl: "https://user:pass@github.com/octocat" }).success).toBe(false);
    expect(profileSchema.safeParse({ githubUrl: "https://github.com/-bad" }).success).toBe(false);
    expect(profileSchema.safeParse({ portfolioUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("preserves optional fields when a partial or USSD-style update is applied", async () => {
    const repository = new MemoryRepository();
    await repository.updateProfile(DEMO_USER_ID, {
      githubUrl: "https://github.com/octocat",
      portfolioUrl: "https://example.com",
      projects: [{ title: "Research tool", description: "Built a useful tool.", tags: [] }],
      shareWithOrganizations: true,
    });
    const updated = await repository.updateProfile(DEMO_USER_ID, { notificationFrequency: "weekly" });
    expect(updated.githubUrl).toBe("https://github.com/octocat");
    expect(updated.projects[0]?.title).toBe("Research tool");
    expect(updated.shareWithOrganizations).toBe(true);
  });

  it("tracks every profile field and reports fields still missing", () => {
    const baseline = { name: "Amina", skills: ["research"] };
    const complete = {
      ...baseline,
      email: "amina@example.com",
      phone: "+256700000001",
      dateOfBirth: new Date("2002-05-14T00:00:00.000Z"),
      location: "Kampala",
      educationLevel: "bachelors",
      institution: "Makerere University",
      fieldOfStudy: "computer science",
      graduationStatus: "final year",
      certifications: ["google data analytics"],
      languages: ["English"],
      workExperience: [{ title: "Researcher", months: 8 }],
      internshipExperience: [{ title: "Web intern", months: 3 }],
      opportunityCategories: ["internship"],
      careerInterests: ["technology"],
      preferredLocations: ["Kampala"],
      workModePreference: "hybrid" as const,
      githubUrl: "https://github.com/octocat",
      portfolioUrl: "https://example.com",
      otherLinks: [{ label: "LinkedIn", url: "https://example.com/profile" }],
      projects: [{ title: "Research tool", description: "Built a useful tool.", tags: [] }],
    };
    expect(calculateProfileCompleteness(complete)).toBe(100);
    expect(calculateProfileCompleteness({ ...complete, portfolioUrl: null })).toBeLessThan(100);
    expect(getIncompleteProfileFields({ ...complete, portfolioUrl: null })).toContain("Portfolio website");
  });
});
