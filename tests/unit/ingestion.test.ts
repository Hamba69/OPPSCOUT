import { describe, expect, it } from "vitest";

import { DEMO_ORG_ID, DEMO_ORG_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { refreshOpportunityLifecycle } from "@/services/ingestion/freshness";
import { ingestManualOpportunity } from "@/services/ingestion/manual";
import { submitOrganizationOpportunity } from "@/services/ingestion/org-submission";

describe("ingestion quality", () => {
  it("keeps catalog listings separate from organization submissions with the same title", async () => {
    const repository = new MemoryRepository();
    const catalog = (await repository.listOpportunities({ organizationId: DEMO_ORG_ID }))[0];
    expect(catalog.origin).toBe("catalog");
    const submitted = await submitOrganizationOpportunity(repository, DEMO_ORG_USER_ID, {
      title: catalog.title,
      organizationId: catalog.organizationId,
      category: catalog.category,
      description: catalog.description,
      eligibility: catalog.eligibility,
      requiredSkills: catalog.requiredSkills,
      preferredSkills: catalog.preferredSkills,
      location: catalog.location,
      workMode: catalog.workMode,
      deadline: catalog.deadline,
      applicationMethod: catalog.applicationMethod,
      sourceUrl: catalog.sourceUrl,
      verificationStatus: "pending",
      source: "scraped",
      status: "open",
    });
    expect(submitted.id).not.toBe(catalog.id);
    expect(submitted.origin).toBe("organization");
    expect(submitted.source).toBe("org_submitted");
    expect((await repository.listOpportunities({ organizationId: DEMO_ORG_ID, origin: "organization" })).map((item) => item.id)).toEqual([submitted.id]);
  });

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
    const opportunities = await repository.listOpportunities();
    const afterLatestDeadline = new Date(Math.max(...opportunities.map((item) => item.deadline?.getTime() ?? Number.NEGATIVE_INFINITY)) + 1);
    const result = await refreshOpportunityLifecycle(repository, afterLatestDeadline);
    expect(result.closed).toBeGreaterThan(0);
    expect((await repository.listOpportunities()).every((item) => item.status === "closed")).toBe(true);
  });
});
