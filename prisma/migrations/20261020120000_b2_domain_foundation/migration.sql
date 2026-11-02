CREATE TYPE "ApplicantScope" AS ENUM ('uganda_residents', 'ugandan_citizens', 'african_nationals', 'global');
CREATE TYPE "RemoteEligibility" AS ENUM ('unknown', 'uganda', 'east_africa', 'africa', 'global');
CREATE TYPE "ProvenanceType" AS ENUM ('official_page', 'application_system', 'org_attested');
CREATE TYPE "SourceKind" AS ENUM ('api', 'careers_page', 'rss', 'newspaper', 'partner', 'community');
CREATE TYPE "SourceStatus" AS ENUM ('proposed', 'approved', 'paused', 'blocked');
CREATE TYPE "LeadChannel" AS ENUM ('whatsapp', 'tiktok', 'instagram', 'facebook', 'linkedin', 'newspaper', 'web', 'email', 'employer', 'other');
CREATE TYPE "LeadStatus" AS ENUM ('new', 'tracing', 'traced', 'rejected', 'duplicate', 'promoted', 'expired');
CREATE TYPE "ReportStatus" AS ENUM ('open', 'actioned', 'dismissed');

ALTER TABLE "UserProfile"
  ADD COLUMN "countryOfResidence" TEXT NOT NULL DEFAULT 'UG',
  ADD COLUMN "openToAbroad" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Organization"
  ADD COLUMN "officialDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "trustedPoster" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedBy" TEXT;

UPDATE "Organization" AS organization
SET "officialDomains" = COALESCE(
  (
    SELECT ARRAY_AGG(DISTINCT LOWER((REGEXP_MATCH(link, '^https?://([^/:?#]+)', 'i'))[1]))
    FROM UNNEST(organization."officialLinks") AS links(link)
    WHERE link ~* '^https?://[^/:?#]+'
  ),
  ARRAY[]::TEXT[]
);

ALTER TABLE "Opportunity"
  ADD COLUMN "audience" "ApplicantScope",
  ADD COLUMN "canonicalUrl" TEXT,
  ADD COLUMN "contentHash" TEXT,
  ADD COLUMN "countryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "deadlineDateOnly" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "eligibleCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "lastSeenAt" TIMESTAMP(3),
  ADD COLUMN "leadId" UUID,
  ADD COLUMN "needsRecheck" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "provenanceType" "ProvenanceType",
  ADD COLUMN "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "remoteEligibility" "RemoteEligibility" NOT NULL DEFAULT 'unknown',
  ADD COLUMN "sourceId" UUID;

CREATE TABLE "Source" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "SourceKind" NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "organizationId" UUID,
  "status" "SourceStatus" NOT NULL DEFAULT 'proposed',
  "termsReviewedAt" TIMESTAMP(3),
  "termsNotes" TEXT,
  "crawlIntervalHours" INTEGER NOT NULL DEFAULT 24,
  "lastRunAt" TIMESTAMP(3),
  "lastSuccessAt" TIMESTAMP(3),
  "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lead" (
  "id" UUID NOT NULL,
  "channel" "LeadChannel" NOT NULL,
  "status" "LeadStatus" NOT NULL DEFAULT 'new',
  "sourceId" UUID,
  "submittedById" UUID,
  "rawUrl" TEXT,
  "canonicalUrl" TEXT,
  "screenshotPath" TEXT,
  "note" TEXT,
  "extracted" JSONB NOT NULL DEFAULT '{}',
  "candidateOrgName" TEXT,
  "officialUrl" TEXT,
  "organizationId" UUID,
  "fingerprint" TEXT NOT NULL,
  "duplicateOfId" UUID,
  "promotedOpportunityId" UUID,
  "rejectReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tracedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListingReport" (
  "id" UUID NOT NULL,
  "opportunityId" UUID NOT NULL,
  "reporterId" UUID,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "status" "ReportStatus" NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "resolutionNote" TEXT,
  CONSTRAINT "ListingReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IngestionRun" (
  "id" UUID NOT NULL,
  "sourceId" UUID NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "fetched" INTEGER NOT NULL DEFAULT 0,
  "created" INTEGER NOT NULL DEFAULT 0,
  "updated" INTEGER NOT NULL DEFAULT 0,
  "duplicates" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "errors" JSONB NOT NULL DEFAULT '[]',
  CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Source_baseUrl_key" ON "Source"("baseUrl");
CREATE INDEX "Source_status_lastRunAt_idx" ON "Source"("status", "lastRunAt");
CREATE INDEX "Source_organizationId_idx" ON "Source"("organizationId");
CREATE UNIQUE INDEX "Lead_fingerprint_key" ON "Lead"("fingerprint");
CREATE UNIQUE INDEX "Lead_promotedOpportunityId_key" ON "Lead"("promotedOpportunityId");
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");
CREATE INDEX "Lead_canonicalUrl_idx" ON "Lead"("canonicalUrl");
CREATE INDEX "Lead_submittedById_status_idx" ON "Lead"("submittedById", "status");
CREATE INDEX "Lead_sourceId_createdAt_idx" ON "Lead"("sourceId", "createdAt");
CREATE INDEX "Lead_organizationId_status_idx" ON "Lead"("organizationId", "status");
CREATE INDEX "ListingReport_status_createdAt_idx" ON "ListingReport"("status", "createdAt");
CREATE INDEX "ListingReport_opportunityId_idx" ON "ListingReport"("opportunityId");
CREATE UNIQUE INDEX "ListingReport_opportunityId_reporterId_key" ON "ListingReport"("opportunityId", "reporterId");
CREATE INDEX "IngestionRun_sourceId_startedAt_idx" ON "IngestionRun"("sourceId", "startedAt");
CREATE UNIQUE INDEX "Opportunity_leadId_key" ON "Opportunity"("leadId");
CREATE INDEX "Opportunity_audience_status_idx" ON "Opportunity"("audience", "status");
CREATE INDEX "Opportunity_canonicalUrl_idx" ON "Opportunity"("canonicalUrl");
CREATE INDEX "Opportunity_organizationId_status_idx" ON "Opportunity"("organizationId", "status");

ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Source"
  ADD CONSTRAINT "Source_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_submittedById_fkey"
  FOREIGN KEY ("submittedById") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_duplicateOfId_fkey"
  FOREIGN KEY ("duplicateOfId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_promotedOpportunityId_fkey"
  FOREIGN KEY ("promotedOpportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ListingReport"
  ADD CONSTRAINT "ListingReport_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ListingReport"
  ADD CONSTRAINT "ListingReport_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IngestionRun"
  ADD CONSTRAINT "IngestionRun_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Source" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ListingReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IngestionRun" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public."Source",
  public."Lead",
  public."ListingReport",
  public."IngestionRun"
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public."Source",
  public."Lead",
  public."ListingReport",
  public."IngestionRun"
TO service_role;

NOTIFY pgrst, 'reload schema';
