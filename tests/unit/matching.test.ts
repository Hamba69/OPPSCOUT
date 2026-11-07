import { describe, expect, it } from "vitest";

import type { Opportunity, UserProfile } from "@/core/entities/domain";
import { PRIMARY_SEED_OPPORTUNITY_ID } from "@/data/seed-catalog";
import { MemoryRepository, DEMO_USER_ID } from "@/lib/repository/memory";
import { buildRankedFeed } from "@/services/matching/feed";
import { evaluateHardGates } from "@/services/matching/rule-based/hard-gates";
import { RuleBasedMatchEngine } from "@/services/matching/rule-based/engine";
import { OrbitMatchEngine } from "@/services/matching/orbit/engine";
import { assessAutomatedTrust } from "@/services/trust/automated-signals";

async function fixtures(): Promise<{ profile: UserProfile; opportunity: Opportunity }> {
  const repository = new MemoryRepository();
  const profile = await repository.getProfile(DEMO_USER_ID);
  const opportunity = await repository.getOpportunity(PRIMARY_SEED_OPPORTUNITY_ID);
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
    expect(feed.map((match) => match.opportunityId)).not.toContain(PRIMARY_SEED_OPPORTUNITY_ID);
  });

  it("keeps otherwise eligible matches available below the recommendation threshold", async () => {
    const repository = new MemoryRepository();
    const baseline = await buildRankedFeed(repository, DEMO_USER_ID);
    const opportunity = baseline[0]?.opportunity;
    expect(opportunity).toBeDefined();
    const engineAt = (score: number) => ({
      score: async (_profile: UserProfile, _opportunity: Opportunity) => ({
        score,
        matchedFactors: [],
        missingFactors: [],
        generatedBy: "rules" as const,
      }),
    };
    const options = {
      persist: false,
      telemetry: false,
      opportunities: [opportunity!],
    };
    const lowScoringMatch = await buildRankedFeed(repository, DEMO_USER_ID, new Date(), engineAt(20), options);
    expect(lowScoringMatch).toHaveLength(1);
    expect(lowScoringMatch[0]?.score).toBe(20);
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

  it("does not penalize international, on-site scholarships for location or work-mode preferences", async () => {
    const repository = new MemoryRepository();
    const profile = (await repository.getProfile(DEMO_USER_ID))!;
    const base = (await repository.getOpportunity(PRIMARY_SEED_OPPORTUNITY_ID))!;
    const international = { ...base, category: "scholarship", location: "Nairobi, Kenya", workMode: "onsite" as const };
    const localRemote = { ...international, location: "Kampala, Uganda", workMode: "remote" as const };

    for (const engine of [new RuleBasedMatchEngine(), new OrbitMatchEngine()]) {
      const overseasScore = await engine.score(profile, international);
      const localScore = await engine.score(profile, localRemote);
      expect(overseasScore.score).toBe(localScore.score);
      expect([...overseasScore.matchedFactors, ...overseasScore.missingFactors].map((factor) => factor.label))
        .not.toContain("Location");
      expect([...overseasScore.matchedFactors, ...overseasScore.missingFactors].map((factor) => factor.label))
        .not.toContain("Work mode");
    }
  });

  it("requires explicit Ugandan eligibility rather than a Uganda-based venue for flexible categories", async () => {
    const repository = new MemoryRepository();
    const base = (await repository.getOpportunity(PRIMARY_SEED_OPPORTUNITY_ID))!;
    const international = {
      ...base,
      category: "fellowship",
      location: "Nairobi, Kenya",
      workMode: "onsite" as const,
      title: "Distinct International Fellowship",
      description: "An on-site fellowship for Ugandan applicants at a Nairobi-based institute.",
      deadline: new Date(Date.now() + 30 * 86_400_000),
      sourceUrl: "https://example.org/international-fellowship",
    };
    const assessment = await assessAutomatedTrust(repository, international);
    expect(assessment.signals.some((signal) => signal.includes("Uganda-based duty station"))).toBe(false);
    expect(assessment.signals.some((signal) => signal.includes("Eligibility for Ugandan applicants"))).toBe(false);

    const unclear = await assessAutomatedTrust(repository, {
      ...international,
      title: "Distinct International Fellowship Without Eligibility",
      description: "An on-site fellowship at a Nairobi-based institute.",
      sourceUrl: "https://example.org/international-fellowship-no-eligibility",
    });
    expect(unclear.signals.some((signal) => signal.includes("Eligibility for Ugandan applicants"))).toBe(true);
  });
});
