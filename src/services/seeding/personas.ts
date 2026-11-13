import { AI_RULES } from "@/config/ai-rules";
import type { Opportunity, UserProfile } from "@/core/entities/domain";
import { OrbitMatchEngine } from "@/services/matching/orbit/engine";
import { evaluateHardGates } from "@/services/matching/rule-based/hard-gates";
import { visibilityFailures } from "@/services/trust/user-publication-policy";

export interface Persona { id: string; label: string; profile: UserProfile }

type PersonaSpec = Partial<UserProfile> & { ageYears: number };

function makeProfile(id: string, now: Date, spec: PersonaSpec): UserProfile {
  const { ageYears, ...rest } = spec;
  const dateOfBirth = new Date(now.getTime() - (ageYears * 365.25 + 100) * 86_400_000);
  return {
    id, name: id, phone: null, email: null, preferredChannel: "web", secondaryChannels: [], notificationsEnabled: false,
    notificationFrequency: "weekly", educationLevel: null, institution: null, fieldOfStudy: null, graduationStatus: null,
    dateOfBirth, skills: [], workExperience: [], internshipExperience: [], certifications: [], location: "Kampala",
    preferredLocations: [], careerInterests: [], opportunityCategories: [], workModePreference: null, languages: ["English"],
    githubUrl: null, portfolioUrl: null, otherLinks: [], projects: [], shareWithOrganizations: false, shareContactDetails: false,
    orgSharingConsentAt: null, orgSharingConsentVersion: null, profileCompletenessScore: 100, createdAt: now, updatedAt: now,
    ...rest,
  };
}

/** Typical Ugandan seekers. A catalogue is healthy only if each of them has something to apply to. */
export function buildPersonas(now: Date): Persona[] {
  const specs: Array<[string, string, PersonaSpec]> = [
    ["s6-leaver", "Senior 6 leaver", { ageYears: 19, educationLevel: "secondary", graduationStatus: "graduated", careerInterests: ["technology", "education"], skills: ["communication", "computer literacy"] }],
    ["undergraduate", "Undergraduate (third year)", { ageYears: 21, educationLevel: "secondary", graduationStatus: "third year", fieldOfStudy: "computer science", careerInterests: ["technology", "data"], skills: ["python", "javascript", "teamwork"] }],
    ["final-year", "Final-year student", { ageYears: 22, educationLevel: "bachelors", graduationStatus: "final year", fieldOfStudy: "social sciences", careerInterests: ["policy", "social impact"], skills: ["research", "report writing", "communication"] }],
    ["fresh-graduate", "Fresh graduate", { ageYears: 23, educationLevel: "bachelors", graduationStatus: "graduated within 12 months", fieldOfStudy: "business administration", careerInterests: ["business", "finance"], skills: ["excel", "bookkeeping", "communication"] }],
    ["early-career", "Early-career professional", { ageYears: 27, educationLevel: "bachelors", graduationStatus: "graduated", fieldOfStudy: "statistics", careerInterests: ["data", "research"], skills: ["data analysis", "excel", "sql"], workExperience: [{ title: "Data officer", months: 36 }] }],
    ["mid-career", "Mid-career manager", { ageYears: 36, educationLevel: "masters", graduationStatus: "graduated", fieldOfStudy: "public administration", careerInterests: ["social impact", "community development"], skills: ["project management", "monitoring and evaluation", "report writing"], workExperience: [{ title: "Programme manager", months: 120 }] }],
    ["researcher", "Researcher (PhD)", { ageYears: 33, educationLevel: "phd", graduationStatus: "graduated", fieldOfStudy: "public health", careerInterests: ["health", "research"], skills: ["research", "data analysis"], workExperience: [{ title: "Research fellow", months: 72 }] }],
    ["vocational-entrepreneur", "Diploma holder and entrepreneur", { ageYears: 24, educationLevel: "diploma", graduationStatus: "graduated", location: "Gulu", careerInterests: ["agriculture", "business"], skills: ["agriculture", "entrepreneurship"], opportunityCategories: ["grant", "training"] }],
  ];
  return specs.map(([id, label, spec]) => ({ id, label, profile: makeProfile(id, now, spec) }));
}

export interface PersonaCoverage {
  persona: string;
  label: string;
  visible: number;
  eligible: number;
  matched: number;
  /** Matches with at least 45 days left, so the person has time to act. */
  matchedWithRunway: number;
  topTitles: string[];
  meetsTarget: boolean;
}

export interface CoverageOptions { now: Date; minMatches?: number; threshold?: number; minRunwayDays?: number }

export async function computeCoverage(opportunities: Opportunity[], options: CoverageOptions): Promise<PersonaCoverage[]> {
  const { now } = options;
  const minMatches = options.minMatches ?? 3;
  const threshold = options.threshold ?? AI_RULES.relevanceThreshold;
  const runwayMs = (options.minRunwayDays ?? 45) * 86_400_000;
  const engine = new OrbitMatchEngine();
  const visible = opportunities.filter((opportunity) => visibilityFailures(opportunity, now).length === 0);
  const out: PersonaCoverage[] = [];
  for (const persona of buildPersonas(now)) {
    const eligible = visible.filter((opportunity) => evaluateHardGates(persona.profile, opportunity).eligible);
    const scored = await Promise.all(eligible.map(async (opportunity) => ({ opportunity, score: (await engine.score(persona.profile, opportunity)).score })));
    const matched = scored.filter((item) => item.score >= threshold).sort((a, b) => b.score - a.score);
    const withRunway = matched.filter(({ opportunity }) => opportunity.deadline === null || opportunity.deadline.getTime() - now.getTime() >= runwayMs);
    out.push({
      persona: persona.id, label: persona.label, visible: visible.length, eligible: eligible.length, matched: matched.length,
      matchedWithRunway: withRunway.length, topTitles: matched.slice(0, 3).map((item) => item.opportunity.title), meetsTarget: withRunway.length >= minMatches,
    });
  }
  return out;
}
