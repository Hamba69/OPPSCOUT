import { AI_RULES } from "@/config/ai-rules";
import type { Opportunity, UserProfile } from "@/core/entities/domain";
import { AppError } from "@/core/errors/app-error";
import type { MatchEngine, MatchResult } from "@/core/interfaces/match-engine";
import type { OpportunityAnalyzer } from "@/services/ai/types";
import { RuleBasedMatchEngine } from "@/services/matching/rule-based/engine";
import { evaluateHardGates } from "@/services/matching/rule-based/hard-gates";

export class AiAssistedMatchEngine implements MatchEngine {
  public constructor(private readonly analyzer: OpportunityAnalyzer, private readonly baseline: MatchEngine = new RuleBasedMatchEngine()) {}
  public async score(profile: UserProfile, opportunity: Opportunity): Promise<MatchResult> {
    const gates = evaluateHardGates(profile, opportunity); if (!gates.eligible) throw new AppError(`Eligibility gate failed: ${gates.failed.map((factor) => factor.detail).join("; ")}`, 422, "ELIGIBILITY_GATE_FAILED");
    const [base, analysis] = await Promise.all([this.baseline.score(profile, opportunity), this.analyzer.analyze({ profileSummary: JSON.stringify({ fieldOfStudy: profile.fieldOfStudy, skills: profile.skills, experience: [...profile.workExperience, ...profile.internshipExperience], careerInterests: profile.careerInterests, locations: profile.preferredLocations, workMode: profile.workModePreference }), opportunityText: JSON.stringify({ title: opportunity.title, category: opportunity.category, description: opportunity.description, requiredSkills: opportunity.requiredSkills, preferredSkills: opportunity.preferredSkills, location: opportunity.location, workMode: opportunity.workMode }) })]);
    const adjustment = Math.max(-AI_RULES.maximumScoreAdjustment, Math.min(AI_RULES.maximumScoreAdjustment, analysis.scoreAdjustment));
    return { score: Math.max(0, Math.min(100, Math.round(base.score + adjustment))), matchedFactors: analysis.matchedFactors, missingFactors: analysis.missingFactors, generatedBy: "ai" };
  }
}
