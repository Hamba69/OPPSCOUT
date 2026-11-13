-- Rolling programmes (open until filled, no closing date) were invisible because
-- the user-facing gate required a future deadline. `rolling` listings may now have
-- no deadline, but only stay visible while they are re-checked regularly.
CREATE TYPE "DeadlineType" AS ENUM ('fixed', 'rolling');

ALTER TABLE "Opportunity"
ADD COLUMN "deadlineType" "DeadlineType" NOT NULL DEFAULT 'fixed';

NOTIFY pgrst, 'reload schema';
