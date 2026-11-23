import type { ProfileInput } from "@/lib/repository/types";

const PROFILE_COMPLETENESS_FIELDS: ReadonlyArray<{ label: string; isFilled: (profile: ProfileInput) => boolean }> = [
  { label: "Full name", isFilled: (profile) => Boolean(profile.name?.trim()) },
  { label: "Email address", isFilled: (profile) => Boolean(profile.email?.trim()) },
  { label: "Phone number", isFilled: (profile) => Boolean(profile.phone?.trim()) },
  { label: "Date of birth", isFilled: (profile) => Boolean(profile.dateOfBirth) },
  { label: "Current location", isFilled: (profile) => Boolean(profile.location?.trim()) },
  { label: "Education level", isFilled: (profile) => Boolean(profile.educationLevel?.trim()) },
  { label: "Institution", isFilled: (profile) => Boolean(profile.institution?.trim()) },
  { label: "Field of study", isFilled: (profile) => Boolean(profile.fieldOfStudy?.trim()) },
  { label: "Study status", isFilled: (profile) => Boolean(profile.graduationStatus?.trim()) },
  { label: "Skills", isFilled: (profile) => Boolean(profile.skills?.length) },
  { label: "Certifications", isFilled: (profile) => Boolean(profile.certifications?.length) },
  { label: "Languages", isFilled: (profile) => Boolean(profile.languages?.length) },
  { label: "Work experience", isFilled: (profile) => Boolean(profile.workExperience?.some((item) => item.title.trim())) },
  { label: "Internships", isFilled: (profile) => Boolean(profile.internshipExperience?.some((item) => item.title.trim())) },
  { label: "Opportunity types", isFilled: (profile) => Boolean(profile.opportunityCategories?.length) },
  { label: "Career interests", isFilled: (profile) => Boolean(profile.careerInterests?.length) },
  { label: "Preferred locations", isFilled: (profile) => Boolean(profile.preferredLocations?.length) },
  { label: "Work arrangement", isFilled: (profile) => Boolean(profile.workModePreference) },
  { label: "GitHub profile", isFilled: (profile) => Boolean(profile.githubUrl?.trim()) },
  { label: "Portfolio website", isFilled: (profile) => Boolean(profile.portfolioUrl?.trim()) },
  { label: "Other links", isFilled: (profile) => Boolean(profile.otherLinks?.some((item) => item.label.trim() && item.url.trim())) },
  { label: "Projects", isFilled: (profile) => Boolean(profile.projects?.some((item) => item.title.trim())) },
];

export function getIncompleteProfileFields(profile: ProfileInput): string[] {
  return PROFILE_COMPLETENESS_FIELDS.filter((field) => !field.isFilled(profile)).map((field) => field.label);
}

/**
 * The fields the completeness percentage counts, in the order the home card suggests them: what matching
 * relies on first. Optional extras (phone, certifications, experience, internships, links and projects)
 * are listed separately and never lower the percentage, so the home card and the profile page always
 * show the same number.
 */
export const CORE_PROFILE_FIELDS: readonly string[] = [
  "Field of study", "Education level", "Skills", "Opportunity types", "Current location", "Study status", "Languages",
  "Career interests", "Preferred locations", "Work arrangement", "Date of birth", "Institution", "Email address", "Full name",
];

/** Core fields still empty, in suggestion order. */
export function getMissingCoreFields(profile: ProfileInput): string[] {
  const missing = new Set(getIncompleteProfileFields(profile));
  return CORE_PROFILE_FIELDS.filter((label) => missing.has(label));
}

/** Optional extras still empty. They help publishers but do not count towards the percentage. */
export function getMissingOptionalFields(profile: ProfileInput): string[] {
  return getIncompleteProfileFields(profile).filter((label) => !CORE_PROFILE_FIELDS.includes(label));
}

/** The one profile completeness percentage, shown on the home card and the profile page and stored on the profile. */
export function calculateProfileCompleteness(profile: ProfileInput): number {
  return Math.round(((CORE_PROFILE_FIELDS.length - getMissingCoreFields(profile).length) / CORE_PROFILE_FIELDS.length) * 100);
}

/** The details matching depends on. A profile with all of these is "complete" for the purpose of finding matches. */
export function isProfileCompleteForMatching(profile: ProfileInput): boolean {
  return Boolean(profile.name?.trim() && profile.educationLevel && profile.fieldOfStudy && profile.location
    && profile.skills?.length && profile.opportunityCategories?.length);
}
