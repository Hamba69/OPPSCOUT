import type { ProfileInput } from "@/lib/repository/types";
import { getIncompleteProfileFields } from "@/services/profile/completeness";

/** The one suggestion shown on the home page while a profile is incomplete. */
export interface ProfileNudge { completeness: number; field: string; tip: string; href: string }

/**
 * The fields the home card counts, in the order it suggests them: what matching relies on first.
 * Optional extras (phone, certifications, experience, internships, links and projects) are ignored,
 * so a seeker who has filled in the essentials never sees the card.
 */
const CORE_FIELDS = [
  "Field of study", "Education level", "Skills", "Opportunity types", "Current location", "Study status", "Languages",
  "Career interests", "Preferred locations", "Work arrangement", "Date of birth", "Institution", "Email address", "Full name",
];

/** Profile form section that holds each field, so the link opens the right place. */
const SECTION: Record<string, string> = {
  "Full name": "personal", "Email address": "personal", "Phone number": "personal", "Date of birth": "personal", "Current location": "personal",
  "Education level": "education", Institution: "education", "Field of study": "education", "Study status": "education",
  Skills: "skills", Certifications: "skills", Languages: "skills",
  "Work experience": "experience", Internships: "experience",
  "Opportunity types": "preferences", "Career interests": "preferences", "Preferred locations": "preferences", "Work arrangement": "preferences",
  "GitHub profile": "work", "Portfolio website": "work", "Other links": "work", Projects: "work",
};

const TIPS: Record<string, string> = {
  Languages: "Add the languages you can work in. Some listings ask for French or Swahili.",
  "Date of birth": "Add your date of birth. Some opportunities have age limits.",
};

const tipFor = (field: string): string => TIPS[field] ?? `Add your ${field.toLowerCase()} to sharpen your matches.`;

/** Null once every core field is filled in, so the home page leaves the card out. */
export function profileNudge(profile: ProfileInput): ProfileNudge | null {
  const missing = getIncompleteProfileFields(profile).filter((label) => CORE_FIELDS.includes(label));
  if (!missing.length) return null;
  const field = CORE_FIELDS.find((label) => missing.includes(label))!;
  const completeness = Math.round(((CORE_FIELDS.length - missing.length) / CORE_FIELDS.length) * 100);
  return { completeness, field, tip: tipFor(field), href: `/profile#${SECTION[field] ?? "personal"}` };
}
