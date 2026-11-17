export const AI_RULES = {
  model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
  maxTokens: 1_200,
  timeoutMs: 20_000,
  maximumScoreAdjustment: 10,
  relevanceThreshold: 60,
  /** Lowest score a seeker sees in their own match lists (feed, matches API, USSD, new-match alerts). Below this the
   *  listing is still in the catalogue and on its own page, but it is not presented to them as a match. */
  seekerMatchMinimumScore: 50,
  minimumPrecision: 0.8,
} as const;
