import type { Opportunity } from "@/core/entities/domain";
import { FIELD_CONCEPTS, LOCATION_PARENT, SKILL_CONCEPTS } from "@/services/matching/orbit/ontology";

export interface ProfileChoice { value: string; label: string; keywords?: string[] }
export type ProfileChoiceField = "educationLevel" | "fieldOfStudy" | "graduationStatus" | "location" | "skills" | "careerInterests" | "preferredLocations" | "opportunityCategories" | "languages";
export type ProfileChoices = Record<ProfileChoiceField, ProfileChoice[]>;

const LABELS: Record<string, string> = {
  bachelors: "Bachelor’s degree", masters: "Master’s degree", phd: "Doctorate / PhD", secondary: "Secondary school",
  certificate: "Certificate", diploma: "Diploma", "no formal education": "No formal education",
  javascript: "JavaScript", typescript: "TypeScript", sql: "SQL", python: "Python", excel: "Excel", "it support": "IT support",
  job: "Jobs", internship: "Internships", scholarship: "Scholarships", fellowship: "Fellowships", consultancy: "Consultancies", grant: "Grants", training: "Training",
};

export function choiceLabel(value: string): string {
  return LABELS[value] ?? value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function choices(values: string[]): ProfileChoice[] {
  // Keep exact values: programme rules use literal normalized comparisons.
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
    .map((value) => ({ value, label: choiceLabel(value) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function buildProfileChoices(opportunities: Opportunity[] = []): ProfileChoices {
  const rules = opportunities.flatMap((opportunity) => opportunity.eligibility.programmeRules ?? []);
  const places = [...Object.keys(LOCATION_PARENT).filter((place) => !["central", "eastern", "northern", "western"].includes(place)).map(choiceLabel), "Remote", "Uganda", ...opportunities.map((opportunity) => opportunity.location), ...rules.filter((rule) => rule.field === "location").flatMap((rule) => rule.allowedValues)];
  const skills = choices([...SKILL_CONCEPTS.map((concept) => concept.id), "typescript", "react", "node js", ...opportunities.flatMap((opportunity) => [...opportunity.requiredSkills, ...opportunity.preferredSkills])]);
  for (const skill of skills) skill.keywords = SKILL_CONCEPTS.find((concept) => concept.id === skill.value)?.aliases;
  return {
    educationLevel: choices(["secondary", "certificate", "diploma", "bachelors", "masters", "phd", "no formal education", ...opportunities.flatMap((opportunity) => opportunity.eligibility.educationLevels ?? [])]),
    fieldOfStudy: choices([...FIELD_CONCEPTS.flatMap((concept) => [concept.id, ...concept.aliases.filter((alias) => alias.length > 2)]), ...opportunities.flatMap((opportunity) => opportunity.eligibility.fieldsOfStudy ?? [])]),
    graduationStatus: choices(["studying", "first year", "second year", "third year", "final year", "graduated", "graduate", "graduated within 12 months", "masters student", "phd student", ...rules.filter((rule) => rule.field === "graduationStatus").flatMap((rule) => rule.allowedValues)]),
    location: choices(places), preferredLocations: choices(places), skills,
    careerInterests: choices(["technology", "data", "research", "social impact", "community development", "health", "agriculture", "finance", "business", "policy", "environment", "media", "education", "security"]),
    opportunityCategories: choices(["job", "internship", "scholarship", "fellowship", "consultancy", "grant", "training", ...opportunities.map((opportunity) => opportunity.category)]),
    languages: choices(["English", "Luganda", "Swahili", "French", "Arabic", "Runyankore", "Acholi", "Ateso", "Lusoga", "Luo", "Lugbara", ...rules.filter((rule) => rule.field === "language").flatMap((rule) => rule.allowedValues)]),
  };
}
