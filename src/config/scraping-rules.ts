export const SCRAPING_RULES = {
  shadowBucket: process.env.OPPSCOUT_SCRAPER_SHADOW_BUCKET ?? "oppscout-scraper-shadow",
  requestTimeoutMs: 15_000,
  maximumDocumentBytes: 1_000_000,
  maximumSitemapBytes: 5_000_000,
  maximumDiscoveredPagesPerRun: 10_000,
  maximumPagesPerRun: 2,
  maximumSitemapsPerRun: 10,
  shadowCandidateRetentionDays: 14,
  minimumCrawlDelayMs: 1_000,
  freshnessToleranceHours: 24,
  duplicateErrorTargetPercent: 1,
  freshnessErrorTargetPercent: 1,
} as const;

export const SUPPORTED_SCRAPING_HOSTS = [
  "jobadverts.co.ke",
  "jobslinking.com",
  "ugjobnet.com",
] as const;
