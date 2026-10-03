import type { MatchFactor } from "@/core/interfaces/match-engine";
import type { Opportunity, UserProfile } from "@/core/entities/domain";
import { includesNormalized, normalize } from "@/services/matching/rule-based/normalize";

export interface GateResult {
  eligible: boolean;
  passed: MatchFactor[];
  failed: MatchFactor[];
}

export const HARD_GATE_DESCRIPTIONS = [
  ["Education eligibility", "Requires a recorded education level accepted by the provider."],
  ["Mandatory certifications", "Requires every certification marked mandatory."],
  ["Age eligibility", "Checks recorded birth date against the programme age range."],
  ["Programme rules", "Checks each provider rule for language, graduation status, or location."],
] as const;

function ageOn(dateOfBirth: Date, at: Date): number {
  let age = at.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const beforeBirthday =
    at.getUTCMonth() < dateOfBirth.getUTCMonth() ||
    (at.getUTCMonth() === dateOfBirth.getUTCMonth() && at.getUTCDate() < dateOfBirth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function evaluateHardGates(profile: UserProfile, opportunity: Opportunity): GateResult {
  const passed: MatchFactor[] = [];
  const failed: MatchFactor[] = [];
  const eligibility = opportunity.eligibility;

  if (eligibility.educationLevels?.length) {
    const educationMatches =
      Boolean(profile.educationLevel) && includesNormalized(eligibility.educationLevels, profile.educationLevel ?? "");
    (educationMatches ? passed : failed).push({
      label: "Education eligibility",
      detail: educationMatches
        ? `Your education level (${profile.educationLevel}${profile.institution ? `, ${profile.institution}` : ""}) is accepted for this opportunity.`
        : profile.educationLevel
          ? `Your education level is ${profile.educationLevel}; this opportunity requires one of: ${eligibility.educationLevels.join(", ")}.`
          : `Add your education level. This opportunity requires one of: ${eligibility.educationLevels.join(", ")}.`,
    });
  }

  const requiredCertifications = eligibility.mandatoryCertifications ?? [];
  if (requiredCertifications.length) {
    const missing = requiredCertifications.filter((item) => !includesNormalized(profile.certifications, item));
    (missing.length ? failed : passed).push({
      label: "Mandatory certifications",
      detail: missing.length
        ? `Your profile is missing: ${missing.join(", ")}. You currently list: ${profile.certifications.length ? profile.certifications.join(", ") : "none"}.`
        : `All mandatory certifications are present on your profile (${requiredCertifications.join(", ")}).`,
    });
  }

  if (eligibility.minimumAge !== undefined || eligibility.maximumAge !== undefined) {
    const age = profile.dateOfBirth ? ageOn(profile.dateOfBirth, opportunity.deadline ?? new Date()) : null;
    const matches =
      age !== null &&
      (eligibility.minimumAge === undefined || age >= eligibility.minimumAge) &&
      (eligibility.maximumAge === undefined || age <= eligibility.maximumAge);
    (matches ? passed : failed).push({
      label: "Age eligibility",
      detail:
        age === null
          ? "Add your date of birth on your profile to verify this programme's age rule."
          : matches
            ? `Your age (${age}) meets the programme rule${eligibility.minimumAge !== undefined ? ` (from ${eligibility.minimumAge}` : ""}${eligibility.maximumAge !== undefined ? ` to ${eligibility.maximumAge})` : ")"}.`
            : `Your age (${age}) is outside the required range${eligibility.minimumAge !== undefined ? ` from ${eligibility.minimumAge}` : ""}${eligibility.maximumAge !== undefined ? ` to ${eligibility.maximumAge}` : ""}.`,
    });
  }

  for (const rule of eligibility.programmeRules ?? []) {
    const values =
      rule.field === "language"
        ? profile.languages
        : [rule.field === "graduationStatus" ? profile.graduationStatus ?? "" : profile.location ?? ""];
    const matches = rule.allowedValues.some((allowed) =>
      values.some((value) => normalize(value) === normalize(allowed)),
    );
    (matches ? passed : failed).push({
      label: rule.label,
      detail: matches
        ? `Your profile meets “${rule.label}” (matched against: ${rule.allowedValues.join(", ")}).`
        : `Requires one of: ${rule.allowedValues.join(", ")}. Update your profile if this should apply to you.`,
    });
  }

  if (!passed.length && !failed.length) {
    passed.push({
      label: "Eligibility gates",
      detail: "No mandatory exclusion rule applies to your profile for this listing.",
    });
  }

  return { eligible: failed.length === 0, passed, failed };
}
