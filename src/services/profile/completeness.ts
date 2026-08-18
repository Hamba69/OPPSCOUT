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
