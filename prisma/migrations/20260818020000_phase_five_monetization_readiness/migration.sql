CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'growth', 'partner');
CREATE TYPE "SubscriptionStatus" AS ENUM ('inactive', 'trial', 'active', 'past_due', 'cancelled');
ALTER TABLE "Organization"
  ADD COLUMN "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'free',
  ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'inactive',
  ADD COLUMN "monetizationEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "promotedListingCredits" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "promotionPolicy" JSONB NOT NULL DEFAULT '{}';
