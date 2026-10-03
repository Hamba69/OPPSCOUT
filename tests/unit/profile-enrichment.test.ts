import { describe, expect, it } from "vitest";

import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { profileSchema } from "@/lib/validation";
import { calculateProfileCompleteness } from "@/services/profile/completeness";

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

  it("does not change completeness when optional fields are added", () => {
    const baseline = { name: "Amina", skills: ["research"] };
    expect(calculateProfileCompleteness({ ...baseline })).toBe(calculateProfileCompleteness({
      ...baseline,
      githubUrl: "https://github.com/octocat",
      projects: [{ title: "Research tool", description: "Built a useful tool.", tags: [] }],
    }));
  });
});
