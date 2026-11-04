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

export function calculateProfileCompleteness(profile: ProfileInput): number {
  return Math.round(((PROFILE_COMPLETENESS_FIELDS.length - getIncompleteProfileFields(profile).length) / PROFILE_COMPLETENESS_FIELDS.length) * 100);
}

/** The details matching depends on. A profile with all of these is "complete" for the purpose of finding matches. */
export function isProfileCompleteForMatching(profile: ProfileInput): boolean {
  return Boolean(profile.name?.trim() && profile.educationLevel && profile.fieldOfStudy && profile.location
    && profile.skills?.length && profile.opportunityCategories?.length);
}
