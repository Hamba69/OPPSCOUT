import { describe, expect, it } from "vitest";

import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { buildRankedFeed } from "@/services/matching/feed";
import { OrbitMatchEngine } from "@/services/matching/orbit/engine";
import { canonicalPhrase, locationSimilarity, SKILL_INDEX } from "@/services/matching/orbit/canonical";
import { PRIMARY_SEED_OPPORTUNITY_ID } from "@/data/seed-catalog";

describe("OrbitMatch", () => {
  it("collapses spelling and phrasing variants into one skill orbit", () => {
    for (const v of ["Data Analytics", "data-analysis", "Analysing data", "Statistical analysis"]) expect(SKILL_INDEX.resolve(v, true)?.concept).toBe("data analysis");
    expect(canonicalPhrase("Programme Management")).toBe(canonicalPhrase("program management"));
  });
  it("snaps a typo to the nearest known skill", () => { expect(SKILL_INDEX.resolve("Javscript", true)?.concept).toBe("javascript"); });
  it("does not let short aliases fire inside unrelated words", () => { expect(SKILL_INDEX.scan("this is a promise to meet").length).toBe(0); });
  it("gives commute-zone and region partial credit", () => {
    expect(locationSimilarity("Kampala", "Wakiso")).toBeGreaterThan(0.8);
    expect(locationSimilarity("Jinja", "Mbale")).toBe(0.5);
    expect(locationSimilarity("Kampala", "Gulu")).toBe(0);
  });
  it("is deterministic, bounded, and always explains itself", async () => {
    const repo = new MemoryRepository();
    const profile = (await repo.getProfile(DEMO_USER_ID))!; const opp = (await repo.getOpportunity(PRIMARY_SEED_OPPORTUNITY_ID))!;
    const a = await new OrbitMatchEngine().score(profile, opp); const b = await new OrbitMatchEngine().score(profile, opp);
    expect(a).toEqual(b); expect(a.score).toBeGreaterThanOrEqual(0); expect(a.score).toBeLessThanOrEqual(100);
    expect(a.matchedFactors.length).toBeGreaterThan(0); expect(a.missingFactors.length).toBeGreaterThan(0);
  });
  it("ranks a related-skill candidate above an unrelated one", async () => {
    const repo = new MemoryRepository();
    const profile = (await repo.getProfile(DEMO_USER_ID))!; const opp = (await repo.getOpportunity(PRIMARY_SEED_OPPORTUNITY_ID))!;
    const engine = new OrbitMatchEngine();
    const close = await engine.score({ ...profile, skills: ["typescript", "written communication"] }, opp);
    const far = await engine.score({ ...profile, skills: ["welding", "driving"] }, opp);
    expect(close.score).toBeGreaterThan(far.score);
  });
  it("still hard-gates ineligible users through the feed", async () => {
    const repo = new MemoryRepository(); await repo.updateProfile(DEMO_USER_ID, { educationLevel: "secondary" });
    expect((await buildRankedFeed(repo, DEMO_USER_ID, new Date(), new OrbitMatchEngine())).map((m) => m.opportunityId)).not.toContain(PRIMARY_SEED_OPPORTUNITY_ID);
  });
});
