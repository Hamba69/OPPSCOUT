import { describe, expect, it } from "vitest";
import type { OpportunityTextExtractor } from "@/services/ai/types";
import { DEMO_ORG_ID, MemoryRepository } from "@/lib/repository/memory";
import { MemoryShadowOpportunityStore } from "@/services/ingestion/scraping/memory-shadow-store";
import { getShadowValidationSnapshot } from "@/services/ingestion/scraping/metrics";
import { runShadowDiscovery } from "@/services/ingestion/scraping/pipeline";

describe("scraper shadow mode", () => {
  it("stores extracted candidates without writing live opportunities", async () => {
    const repository = new MemoryRepository(); const store = new MemoryShadowOpportunityStore(); const before = (await repository.listOpportunities()).length;
    const extractor: OpportunityTextExtractor = { extract: async () => ({ title: "New Climate Fellowship", category: "fellowship", description: "A verified learning fellowship for climate data work in Ugandan communities.", eligibility: { educationLevels: ["bachelors"] }, requiredSkills: ["research"], preferredSkills: ["data analysis"], location: "Kampala", workMode: "hybrid", deadline: new Date(Date.now() + 30 * 86_400_000).toISOString(), applicationMethod: "Apply on the official page" }) };
    await runShadowDiscovery({ sourceUrl: "https://official.example/fellowship", organizationId: DEMO_ORG_ID }, repository, extractor, store, async () => new Response("<html><body>Official opportunity</body></html>"));
    expect((await repository.listOpportunities()).length).toBe(before); expect((await store.list())).toHaveLength(1);
    expect((await getShadowValidationSnapshot(store)).liveOpportunityWrites).toBe(0);
  });
});
