import type { MatchFactor } from "@/core/interfaces/match-engine";
import type { ProfileLink, ProfileProject, UserProfile } from "@/core/entities/domain";

export interface CandidateCard {
  seekerId: string;
  firstName: string;
  lastInitial: string;
  institution: string | null;
  fieldOfStudy: string | null;
  educationLevel: string | null;
  location: string | null;
  score: number;
  matchedFactors: MatchFactor[];
  missingFactors: MatchFactor[];
  topSkills: string[];
  fullName?: string;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  otherLinks?: ProfileLink[];
  projects?: ProfileProject[];
  email?: string | null;
  phone?: string | null;
}

function adult(dateOfBirth: Date | null): boolean {
  if (!dateOfBirth) return false;
  const now = new Date();
  return now.getUTCFullYear() - dateOfBirth.getUTCFullYear() - ((now.getUTCMonth() < dateOfBirth.getUTCMonth() || (now.getUTCMonth() === dateOfBirth.getUTCMonth() && now.getUTCDate() < dateOfBirth.getUTCDate())) ? 1 : 0) >= 18;
}

export function toCandidateCard(profile: UserProfile, match: { score: number; matchedFactors: MatchFactor[]; missingFactors: MatchFactor[] }, consent: { shareWithOrganizations: boolean; shareContactDetails: boolean; detail: boolean }): CandidateCard | null {
  if (!consent.shareWithOrganizations || !adult(profile.dateOfBirth)) return null;
  const [firstName = "", ...rest] = profile.name.trim().split(/\s+/);
  const card: CandidateCard = {
    seekerId: profile.id,
    firstName,
    lastInitial: rest.at(-1)?.charAt(0).toUpperCase() ?? "",
    institution: profile.institution,
    fieldOfStudy: profile.fieldOfStudy,
    educationLevel: profile.educationLevel,
    location: profile.location,
    score: match.score,
    matchedFactors: match.matchedFactors,
    missingFactors: match.missingFactors,
    topSkills: profile.skills.slice(0, 5),
  };
  if (!consent.detail) return card;
  card.fullName = profile.name;
  card.githubUrl = profile.githubUrl;
  card.portfolioUrl = profile.portfolioUrl;
  card.otherLinks = profile.otherLinks;
  card.projects = profile.projects;
  if (consent.shareContactDetails) {
    card.email = profile.email;
    card.phone = profile.phone;
  }
  return card;
}
