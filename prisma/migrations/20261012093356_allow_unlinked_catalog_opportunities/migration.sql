ALTER TABLE "Opportunity"
  ALTER COLUMN "organizationId" DROP NOT NULL,
  ADD COLUMN "organizationName" TEXT;

ALTER TYPE "WorkMode" ADD VALUE IF NOT EXISTS 'unknown';
