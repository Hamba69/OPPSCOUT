import { describe, expect, it } from "vitest";

import type { Opportunity, UserProfile } from "@/core/entities/domain";
import { MemoryRepository, DEMO_USER_ID } from "@/lib/repository/memory";
import { buildRankedFeed } from "@/services/matching/feed";
import { evaluateHardGates } from "@/services/matching/rule-based/hard-gates";
import { RuleBasedMatchEngine } from "@/services/matching/rule-based/engine";

async function fixtures(): Promise<{ profile: UserProfile; opportunity: Opportunity }> {
  const repository = new MemoryRepository();
  const profile = await repository.getProfile(DEMO_USER_ID);
  const opportunity = await repository.getOpportunity("55555555-5555-4555-8555-555555555551");
  if (!profile || !opportunity) throw new Error("Test fixtures are missing.");
  return { profile, opportunity };
}

describe("Phase 1 rule matching", () => {
  it("returns a bounded score and non-empty explanations", async () => {
    const { profile, opportunity } = await fixtures();
    const result = await new RuleBasedMatchEngine().score(profile, opportunity);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.matchedFactors.length).toBeGreaterThan(0);
    expect(result.missingFactors.length).toBeGreaterThan(0);
    expect(result.generatedBy).toBe("rules");
  });

  it("hard-excludes a deliberately ineligible education profile", async () => {
    const repository = new MemoryRepository();
    await repository.updateProfile(DEMO_USER_ID, { educationLevel: "secondary" });
    const feed = await buildRankedFeed(repository, DEMO_USER_ID);
    expect(feed).toHaveLength(0);
  });

  it("passes a verified age and fails a missing mandatory certification", async () => {
    const { profile, opportunity } = await fixtures();
    const gated = { ...opportunity, eligibility: { ...opportunity.eligibility, mandatoryCertifications: ["CPA"], minimumAge: 18 } };
    const result = evaluateHardGates(profile, gated);
    expect(result.eligible).toBe(false);
    expect(result.failed.map((factor) => factor.label)).toContain("Mandatory certifications");
    expect(result.passed.map((factor) => factor.label)).toContain("Age eligibility");
  });

  it("fails an age rule conservatively when date of birth is absent", async () => {
    const { profile, opportunity } = await fixtures();
    const result = evaluateHardGates({ ...profile, dateOfBirth: null }, { ...opportunity, eligibility: { minimumAge: 18 } });
    expect(result.eligible).toBe(false);
    expect(result.failed[0]?.detail).toMatch(/date of birth/i);
  });
});
