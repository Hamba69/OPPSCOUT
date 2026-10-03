ALTER TABLE "UserProfile"
  ADD COLUMN "githubUrl" TEXT,
  ADD COLUMN "portfolioUrl" TEXT,
  ADD COLUMN "otherLinks" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "projects" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "shareWithOrganizations" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "shareContactDetails" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "orgSharingConsentAt" TIMESTAMP(3),
  ADD COLUMN "orgSharingConsentVersion" TEXT;
