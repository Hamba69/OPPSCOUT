ALTER TABLE public."Opportunity"
  ALTER COLUMN "organizationId" DROP NOT NULL,
  ADD COLUMN "organizationName" text;

ALTER TYPE public."WorkMode" ADD VALUE IF NOT EXISTS 'unknown';
