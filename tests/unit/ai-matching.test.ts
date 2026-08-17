import { describe, expect, it, vi } from "vitest";
import type { OpportunityAnalyzer } from "@/services/ai/types";
import { MemoryRepository } from "@/lib/repository/memory";
import { AiAssistedMatchEngine } from "@/services/matching/ai-assisted/engine";
import { compareMatchEngines } from "@/services/matching/ai-assisted/comparison";
import { RuleBasedMatchEngine } from "@/services/matching/rule-based/engine";

function analyzer(adjustment = 2): OpportunityAnalyzer { return { analyze: vi.fn(async () => ({ scoreAdjustment: adjustment, matchedFactors: [{ label: "AI relevance", detail: "The experience and interests align." }], missingFactors: [{ label: "Growth area", detail: "Confirm the final application evidence." }], suspiciousSignals: [] })) }; }

describe("AI-assisted matching", () => {
  it("keeps explanations complete and passes a held-out non-regression gate", async () => {
    const repository = new MemoryRepository(); const profile = (await repository.listProfiles())[0]; const opportunities = await repository.listOpportunities({ verificationStatus: "verified" });
    const rules = new RuleBasedMatchEngine(); const ai = new AiAssistedMatchEngine(analyzer());
    const result = await ai.score(profile, opportunities[0]);
    expect(result.generatedBy).toBe("ai"); expect(result.matchedFactors.length).toBeGreaterThan(0); expect(result.missingFactors.length).toBeGreaterThan(0);
    const comparison = await compareMatchEngines(opportunities.map((opportunity) => ({ id: opportunity.id, profile, opportunity, relevant: true })), rules, ai);
    expect(comparison.aiCanBecomeDefault).toBe(true); expect(comparison.aiPrecision).toBeGreaterThanOrEqual(comparison.rulePrecision);
  });

  it("fails a rule-based hard gate before invoking AI", async () => {
    const repository = new MemoryRepository(); const profile = (await repository.listProfiles())[0]; const opportunity = (await repository.listOpportunities({ verificationStatus: "verified" }))[0]; const fake = analyzer();
    await expect(new AiAssistedMatchEngine(fake).score(profile, { ...opportunity, eligibility: { mandatoryCertifications: ["missing certificate"] } })).rejects.toMatchObject({ code: "ELIGIBILITY_GATE_FAILED" });
    expect(fake.analyze).not.toHaveBeenCalled();
  });
});
