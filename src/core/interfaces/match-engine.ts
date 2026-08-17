import type { Opportunity, UserProfile } from "@/core/entities/domain";

export interface MatchFactor {
  label: string;
  detail: string;
}

export interface MatchResult {
  score: number;
  matchedFactors: MatchFactor[];
  missingFactors: MatchFactor[];
  generatedBy: "rules" | "ai";
}

export interface MatchEngine {
  score(profile: UserProfile, opportunity: Opportunity): Promise<MatchResult>;
}
