import type { ProfileInput } from "@/lib/repository/types";

const PROFILE_COMPLETENESS_FIELDS: ReadonlyArray<keyof ProfileInput> = [
  "name", "phone", "email", "educationLevel", "fieldOfStudy", "graduationStatus", "dateOfBirth", "skills", "location",
  "preferredLocations", "careerInterests", "opportunityCategories", "workModePreference", "languages",
];

export function calculateProfileCompleteness(profile: ProfileInput): number {
  const completed = PROFILE_COMPLETENESS_FIELDS.filter((field) => {
    const value = profile[field];
    return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== "";
  }).length;
  return Math.round((completed / PROFILE_COMPLETENESS_FIELDS.length) * 100);
}

/** The details matching depends on. A profile with all of these is "complete" for the purpose of finding matches. */
export function isProfileCompleteForMatching(profile: ProfileInput): boolean {
  return Boolean(profile.name?.trim() && profile.educationLevel && profile.fieldOfStudy && profile.location
    && profile.skills?.length && profile.opportunityCategories?.length);
}
