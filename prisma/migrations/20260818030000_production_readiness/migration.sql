-- Complete age-based eligibility without introducing a new entity.
ALTER TABLE "UserProfile" ADD COLUMN "dateOfBirth" DATE;
