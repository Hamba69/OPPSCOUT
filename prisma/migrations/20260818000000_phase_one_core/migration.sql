-- CreateEnum
CREATE TYPE "PreferredChannel" AS ENUM ('web', 'email', 'sms', 'ussd');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('remote', 'onsite', 'hybrid');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('unverified', 'pending', 'verified', 'flagged');

-- CreateEnum
CREATE TYPE "OpportunitySource" AS ENUM ('org_submitted', 'scraped', 'partner_feed');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('open', 'closing_soon', 'closed', 'stale', 'removed');

-- CreateEnum
CREATE TYPE "GeneratedBy" AS ENUM ('rules', 'ai');

-- CreateEnum
CREATE TYPE "NotificationChannelType" AS ENUM ('email', 'sms', 'ussd', 'app');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('sent', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "SavedOpportunityStatus" AS ENUM ('saved', 'applied', 'expired');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('view', 'save', 'click', 'apply_intent', 'report');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "preferredChannel" "PreferredChannel" NOT NULL DEFAULT 'web',
    "secondaryChannels" "PreferredChannel"[] DEFAULT ARRAY[]::"PreferredChannel"[],
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "educationLevel" TEXT,
    "institution" TEXT,
    "fieldOfStudy" TEXT,
    "graduationStatus" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workExperience" JSONB NOT NULL DEFAULT '[]',
    "internshipExperience" JSONB NOT NULL DEFAULT '[]',
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "preferredLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "careerInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "opportunityCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workModePreference" "WorkMode",
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "profileCompletenessScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "officialLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "officialEmail" TEXT,
    "registrationProof" TEXT,
    "accountableContact" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "dashboardUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postingHistory" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibility" JSONB NOT NULL,
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT NOT NULL,
    "workMode" "WorkMode" NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "applicationMethod" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "source" "OpportunitySource" NOT NULL DEFAULT 'org_submitted',
    "publicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'open',
    "reviewChecklist" JSONB NOT NULL DEFAULT '{}',
    "reviewNotes" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "matchedFactors" JSONB NOT NULL,
    "missingFactors" JSONB NOT NULL,
    "generatedBy" "GeneratedBy" NOT NULL DEFAULT 'rules',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "matchId" UUID,
    "channel" "NotificationChannelType" NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "triggerKey" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedOpportunity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "status" "SavedOpportunityStatus" NOT NULL DEFAULT 'saved',
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" UUID NOT NULL,
    "eventType" "EventType" NOT NULL,
    "userId" UUID,
    "opportunityId" UUID,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_phone_key" ON "UserProfile"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE INDEX "UserProfile_preferredChannel_idx" ON "UserProfile"("preferredChannel");

-- CreateIndex
CREATE INDEX "Organization_verificationStatus_idx" ON "Organization"("verificationStatus");

-- CreateIndex
CREATE INDEX "Opportunity_verificationStatus_status_deadline_idx" ON "Opportunity"("verificationStatus", "status", "deadline");

-- CreateIndex
CREATE INDEX "Opportunity_organizationId_title_deadline_idx" ON "Opportunity"("organizationId", "title", "deadline");

-- CreateIndex
CREATE INDEX "MatchResult_userId_score_idx" ON "MatchResult"("userId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "MatchResult_userId_opportunityId_key" ON "MatchResult"("userId", "opportunityId");

-- CreateIndex
CREATE INDEX "Notification_userId_sentAt_idx" ON "Notification"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "Notification_userId_triggerKey_sentAt_idx" ON "Notification"("userId", "triggerKey", "sentAt");

-- CreateIndex
CREATE INDEX "SavedOpportunity_userId_status_idx" ON "SavedOpportunity"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SavedOpportunity_userId_opportunityId_key" ON "SavedOpportunity"("userId", "opportunityId");

-- CreateIndex
CREATE INDEX "EventLog_eventType_timestamp_idx" ON "EventLog"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "EventLog_userId_timestamp_idx" ON "EventLog"("userId", "timestamp");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
