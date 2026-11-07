import type { MatchFactor } from "@/core/interfaces/match-engine";
import type { Eligibility, WorkMode } from "@/core/entities/domain";

export interface AiOpportunityAnalysis {
  scoreAdjustment: number;
  matchedFactors: MatchFactor[];
  missingFactors: MatchFactor[];
  suspiciousSignals: string[];
}

export interface OpportunityAnalyzer {
  analyze(input: { profileSummary: string; opportunityText: string }): Promise<AiOpportunityAnalysis>;
}

export type ExtractedOpportunityData =
  | { isOpportunity: false }
  | {
    isOpportunity: true;
    title: string; category: string; description: string; eligibility: Eligibility;
    requiredSkills: string[]; preferredSkills: string[]; location: string; workMode: WorkMode;
    deadline: string | null; applicationMethod: string; applicationUrl: string | null;
  };

export interface OpportunityTextExtractor {
  extract(sourceUrl: string, text: string): Promise<ExtractedOpportunityData>;
}
