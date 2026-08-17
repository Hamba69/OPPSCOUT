import { describe, expect, it } from "vitest";

import { DEMO_ORG_ID, MemoryRepository } from "@/lib/repository/memory";
import { refreshOpportunityLifecycle } from "@/services/ingestion/freshness";
import { ingestManualOpportunity } from "@/services/ingestion/manual";

describe("ingestion quality", () => {
  it("merges canonical organization/title/deadline duplicates", async () => {
    const repository = new MemoryRepository();
    const input = {
      title: "Community Data Fellowship",
      organizationId: DEMO_ORG_ID,
      category: "fellowship",
      description: "A practical fellowship using local evidence to support community programmes in Uganda.",
      eligibility: { educationLevels: ["bachelors"] },
      requiredSkills: ["research"], preferredSkills: [], location: "Kampala", workMode: "hybrid" as const,
      deadline: new Date(Date.now() + 30 * 86_400_000), applicationMethod: "Apply on the official page",
      sourceUrl: "https://example.org/community-data", verificationStatus: "pending" as const, source: "org_submitted" as const, status: "open" as const,
    };
    const first = await ingestManualOpportunity(repository, input);
    const second = await ingestManualOpportunity(repository, { ...input, title: "Community Data Fellowship!" });
    expect(second.id).toBe(first.id);
    expect((await repository.listOpportunities({ organizationId: DEMO_ORG_ID })).filter((item) => item.id === first.id)).toHaveLength(1);
  });

  it("automatically closes deadline-passed listings", async () => {
    const repository = new MemoryRepository();
    const result = await refreshOpportunityLifecycle(repository, new Date(Date.now() + 60 * 86_400_000));
    expect(result.closed).toBeGreaterThan(0);
    expect((await repository.listOpportunities()).every((item) => item.status === "closed")).toBe(true);
  });
});
