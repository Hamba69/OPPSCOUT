-- Anyone signed in can post an opportunity. Every member post is reviewed before it goes live, and the
-- reviewer contacts the poster first, so each post records who sent it and how to reach them.
-- `community` marks these posts; no organisation account or verification is involved.
-- Idempotent: this may already have been applied by hand in the Supabase SQL editor.
ALTER TYPE "OpportunityOrigin" ADD VALUE IF NOT EXISTS 'community';

ALTER TABLE "Opportunity"
  ADD COLUMN IF NOT EXISTS "submittedBy" UUID,
  ADD COLUMN IF NOT EXISTS "submitterContact" JSONB;

CREATE INDEX IF NOT EXISTS "Opportunity_submittedBy_idx" ON "Opportunity"("submittedBy");

NOTIFY pgrst, 'reload schema';
