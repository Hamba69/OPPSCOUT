CREATE TYPE "NotificationFrequency" AS ENUM ('instant', 'daily', 'weekly');
ALTER TABLE "UserProfile" ADD COLUMN "notificationFrequency" "NotificationFrequency" NOT NULL DEFAULT 'instant';
