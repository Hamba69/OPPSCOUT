-- Existing listings were catalogued by OppScout, even when their source
-- organization is named on the record. Only future in-app submissions use
-- the organization origin.
CREATE TYPE "OpportunityOrigin" AS ENUM ('catalog', 'organization');

ALTER TABLE "Opportunity"
ADD COLUMN "origin" "OpportunityOrigin" NOT NULL DEFAULT 'catalog';

NOTIFY pgrst, 'reload schema';
