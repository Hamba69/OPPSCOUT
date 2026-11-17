export const AI_RULES = {
  model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
  maxTokens: 1_200,
  timeoutMs: 20_000,
  maximumScoreAdjustment: 10,
  relevanceThreshold: 60,
  minimumPrecision: 0.8,
} as const;
