DO $$ BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('profile-documents', 'profile-documents', false, 5242880,
      ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.oasis.opendocument.text','image/jpeg','image/png'])
    ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;

CREATE TYPE "StoredDocumentOwnerType" AS ENUM ('user', 'organization');
CREATE TYPE "StoredDocumentPurpose" AS ENUM ('research_paper', 'registration_proof');
CREATE TYPE "StoredDocumentStatus" AS ENUM ('pending', 'ready', 'rejected');
CREATE TYPE "SeekerAccessAction" AS ENUM ('view_card', 'view_profile', 'download_document');
CREATE TYPE "SeekerPipelineStage" AS ENUM ('new', 'shortlisted', 'invited', 'contacted', 'not_a_fit');

CREATE TABLE "StoredDocument" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ownerType" "StoredDocumentOwnerType" NOT NULL,
  "ownerId" UUID NOT NULL,
  "purpose" "StoredDocumentPurpose" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "originalFileName" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "sha256" TEXT,
  "status" "StoredDocumentStatus" NOT NULL DEFAULT 'pending',
  "shareWithOrganizations" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoredDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoredDocument_storagePath_key" UNIQUE ("storagePath")
);
CREATE INDEX "StoredDocument_owner_idx" ON "StoredDocument"("ownerType","ownerId","purpose");

CREATE TABLE "SeekerAccessLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" UUID NOT NULL,
  "seekerId" UUID NOT NULL,
  "opportunityId" UUID,
  "action" "SeekerAccessAction" NOT NULL,
  "documentId" UUID,
  CONSTRAINT "SeekerAccessLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SeekerAccessLog_seeker_idx" ON "SeekerAccessLog"("seekerId","createdAt");
CREATE INDEX "SeekerAccessLog_org_idx" ON "SeekerAccessLog"("organizationId","createdAt");

CREATE TABLE "SeekerPipelineEntry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "opportunityId" UUID NOT NULL,
  "seekerId" UUID NOT NULL,
  "stage" "SeekerPipelineStage" NOT NULL DEFAULT 'new',
  "note" TEXT,
  "invitedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SeekerPipelineEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SeekerPipelineEntry_unique" UNIQUE ("organizationId","opportunityId","seekerId")
);
CREATE INDEX "SeekerPipelineEntry_listing_idx" ON "SeekerPipelineEntry"("organizationId","opportunityId","stage");

ALTER TABLE "StoredDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeekerAccessLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeekerPipelineEntry" ENABLE ROW LEVEL SECURITY;
