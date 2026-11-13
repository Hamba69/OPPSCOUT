export const INGESTION_RULES = {
  duplicateDeadlineWindowDays: 3,
  duplicateTitleSimilarity: 0.85,
  organizationStaleAfterDays: 30,
  scrapedStaleAfterDays: 14,
  /** A rolling (no-deadline) listing is shown only while it has been re-checked within this many days. */
  rollingFreshnessDays: 14,
} as const;

export const SOURCE_AUTHORITY = {
  scraped: 1,
  partner_feed: 2,
  org_submitted: 3,
} as const;
