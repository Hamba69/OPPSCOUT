import { AppError } from "@/core/errors/app-error";
import type { MatchEngine } from "@/core/interfaces/match-engine";
import { AnthropicOpportunityAnalyzer } from "@/services/ai/anthropic-analyzer";
import { AiAssistedMatchEngine } from "@/services/matching/ai-assisted/engine";
import { OrbitMatchEngine } from "@/services/matching/orbit/engine";
import { RuleBasedMatchEngine } from "@/services/matching/rule-based/engine";

export function resolveMatchEngine(): MatchEngine {
  if (process.env.OPPSCOUT_AI_DEFAULT !== "true") {
    return process.env.OPPSCOUT_MATCH_ENGINE === "rules" ? new RuleBasedMatchEngine() : new OrbitMatchEngine();
  }
  if (process.env.OPPSCOUT_AI_COMPARISON_APPROVED !== "true") throw new AppError("AI default is blocked until held-out comparison approval is recorded.", 503, "AI_ROLLOUT_BLOCKED");
  return new AiAssistedMatchEngine(new AnthropicOpportunityAnalyzer());
}
