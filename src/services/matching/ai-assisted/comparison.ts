import { AI_RULES } from "@/config/ai-rules";
import type { Opportunity, UserProfile } from "@/core/entities/domain";
import type { MatchEngine } from "@/core/interfaces/match-engine";
import { evaluateHardGates } from "@/services/matching/rule-based/hard-gates";

export interface HeldOutCase { id: string; profile: UserProfile; opportunity: Opportunity; relevant: boolean; }
export interface PrecisionComparison { cases: number; rulePrecision: number; aiPrecision: number; aiCanBecomeDefault: boolean; }
function precision(predictions: Array<{ predicted: boolean; relevant: boolean }>): number { const positives = predictions.filter((item) => item.predicted); return positives.length ? positives.filter((item) => item.relevant).length / positives.length : 0; }
export async function compareMatchEngines(cases: HeldOutCase[], rules: MatchEngine, ai: MatchEngine): Promise<PrecisionComparison> {
  const rulePredictions: Array<{ predicted: boolean; relevant: boolean }> = []; const aiPredictions: Array<{ predicted: boolean; relevant: boolean }> = [];
  for (const item of cases) { const eligible = evaluateHardGates(item.profile, item.opportunity).eligible; const [rule, assisted] = eligible ? await Promise.all([rules.score(item.profile, item.opportunity), ai.score(item.profile, item.opportunity)]) : [{ score: 0 }, { score: 0 }]; rulePredictions.push({ predicted: eligible && rule.score >= AI_RULES.relevanceThreshold, relevant: item.relevant }); aiPredictions.push({ predicted: eligible && assisted.score >= AI_RULES.relevanceThreshold, relevant: item.relevant }); }
  const rulePrecision = precision(rulePredictions); const aiPrecision = precision(aiPredictions);
  return { cases: cases.length, rulePrecision, aiPrecision, aiCanBecomeDefault: cases.length > 0 && aiPrecision >= AI_RULES.minimumPrecision && aiPrecision >= rulePrecision };
}
