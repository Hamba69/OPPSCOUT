export const SCRAPING_RULES = {
  shadowBucket: process.env.OPPSCOUT_SCRAPER_SHADOW_BUCKET ?? "oppscout-scraper-shadow",
  requestTimeoutMs: 15_000,
  maximumDocumentBytes: 1_000_000,
  freshnessToleranceHours: 24,
  duplicateErrorTargetPercent: 1,
  freshnessErrorTargetPercent: 1,
} as const;
