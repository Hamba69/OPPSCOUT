import type { MatchFactor } from "@/core/interfaces/match-engine";
import type { Opportunity, UserProfile } from "@/core/entities/domain";
import { includesNormalized, normalize } from "@/services/matching/rule-based/normalize";

export interface GateResult {
  eligible: boolean;
  passed: MatchFactor[];
  failed: MatchFactor[];
}

export function evaluateHardGates(profile: UserProfile, opportunity: Opportunity): GateResult {
  const passed: MatchFactor[] = [];
  const failed: MatchFactor[] = [];
  const eligibility = opportunity.eligibility;

  if (eligibility.educationLevels?.length) {
    const educationMatches = Boolean(profile.educationLevel) && includesNormalized(eligibility.educationLevels, profile.educationLevel ?? "");
    (educationMatches ? passed : failed).push({
      label: "Education eligibility",
      detail: educationMatches
        ? `${profile.educationLevel} is accepted.`
        : `Requires one of: ${eligibility.educationLevels.join(", ")}.`,
    });
  }

  const requiredCertifications = eligibility.mandatoryCertifications ?? [];
  if (requiredCertifications.length) {
    const missing = requiredCertifications.filter((item) => !includesNormalized(profile.certifications, item));
    (missing.length ? failed : passed).push({
      label: "Mandatory certifications",
      detail: missing.length ? `Missing: ${missing.join(", ")}.` : "All mandatory certifications are present.",
    });
  }

  if (eligibility.minimumAge !== undefined || eligibility.maximumAge !== undefined) {
    failed.push({
      label: "Age eligibility",
      detail: "This programme has an age rule, but the profile has no verified age value.",
    });
  }

  for (const rule of eligibility.programmeRules ?? []) {
    const values = rule.field === "language"
      ? profile.languages
      : [rule.field === "graduationStatus" ? profile.graduationStatus ?? "" : profile.location ?? ""];
    const matches = rule.allowedValues.some((allowed) => values.some((value) => normalize(value) === normalize(allowed)));
    (matches ? passed : failed).push({
      label: rule.label,
      detail: matches ? "Programme-specific requirement is met." : `Requires one of: ${rule.allowedValues.join(", ")}.`,
    });
  }

  if (!passed.length && !failed.length) {
    passed.push({ label: "Eligibility gates", detail: "No mandatory exclusion rule applies." });
  }

  return { eligible: failed.length === 0, passed, failed };
}
