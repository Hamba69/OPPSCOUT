import { z } from "zod";

import type { Eligibility, Opportunity, OpportunityStatus, TrustChecklist, WorkMode } from "@/core/entities/domain";
import { buildReviewChecklist } from "@/services/trust/checklist";

export const SEED_CATEGORIES = ["job", "internship", "scholarship", "fellowship", "grant", "training", "consultancy"] as const;
export const EDUCATION_ORDER = ["secondary", "certificate", "diploma", "bachelors", "masters", "phd"] as const;

const httpsUrl = z.string().url().refine((value) => value.startsWith("https://"), "must be an https URL");
const isoWithOffset = z.string().refine(
  (value) => /(Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value)),
  "must be an ISO 8601 date-time with a timezone, e.g. 2027-01-15T23:59:00+03:00",
);
const quote = z.string().trim().min(15, "quote the page, at least a sentence fragment").max(700);

/** Eligibility the engine can evaluate. Anything else belongs in `additionalRequirements`. */
const eligibilitySchema = z.object({
  minimumEducation: z.enum(EDUCATION_ORDER).optional(),
  /** Use only when the programme is NOT open to every level above the minimum (e.g. current undergraduates only). */
  educationLevels: z.array(z.enum(EDUCATION_ORDER)).optional(),
  fieldsOfStudy: z.array(z.string().trim().min(2)).optional(),
  minimumExperienceMonths: z.number().int().min(0).optional(),
  minimumAge: z.number().int().min(10).max(100).optional(),
  maximumAge: z.number().int().min(10).max(100).optional(),
  mandatoryCertifications: z.array(z.string().trim().min(2)).optional(),
  programmeRules: z.array(z.object({
    field: z.enum(["graduationStatus", "location", "language"]),
    allowedValues: z.array(z.string().trim().min(1)).min(1),
    label: z.string().trim().min(3),
  }).strict()).optional(),
  /** Anything the profile cannot express (nationality, years in a sector, organisation type...). Shown as "confirm with provider". */
  additionalRequirements: z.array(z.string().trim().min(3)).optional(),
}).strict();

export const candidateSchema = z.object({
  title: z.string().trim().min(5).max(200),
  organizationName: z.string().trim().min(2).max(200),
  /** The organisation's own web domain, e.g. "chevening.org". Required: it is how Tier A is established. */
  organizationOfficialDomain: z.string().trim().toLowerCase().regex(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/, "bare domain such as example.org"),
  category: z.enum(SEED_CATEGORIES),
  description: z.string().trim().min(80).max(4000),
  location: z.string().trim().min(2).max(200),
  workMode: z.enum(["remote", "onsite", "hybrid", "unknown"]).default("unknown"),
  requiredSkills: z.array(z.string().trim().min(2)).default([]),
  preferredSkills: z.array(z.string().trim().min(2)).default([]),
  eligibility: eligibilitySchema.default({}),

  /** The page the facts were verified against. Must be a page about this listing, fetched in this run. */
  sourceUrl: httpsUrl,
  applicationUrl: httpsUrl,
  applicationInstructions: z.string().trim().min(15).max(1500),
  /** Where the agent first found it. Provenance only; never trusted. */
  leads: z.array(httpsUrl).default([]),
  retrievedAt: isoWithOffset,
  publicationDate: isoWithOffset.optional(),

  deadlineType: z.enum(["fixed", "rolling"]),
  deadline: isoWithOffset.nullable().default(null),
  /** For rolling listings, how the page words it, e.g. "applications accepted year-round". */
  deadlineQuote: quote,

  ugandanEligibility: z.enum(["explicit", "open_to_all_nationalities", "region_includes_uganda", "unclear", "excluded"]),
  ugandanEligibilityQuote: quote,
  feeAssessment: z.enum(["none", "disclosed_official", "suspicious"]),
  feeNote: z.string().trim().max(400).optional(),
  asksSensitiveDataOffPlatform: z.boolean(),

  /** Anything the agent could not establish. Non-empty means the record is held, never published. */
  unresolved: z.array(z.string().trim().min(3)).default([]),
}).strict().superRefine((value, ctx) => {
  if (value.deadlineType === "fixed" && !value.deadline) {
    ctx.addIssue({ code: "custom", path: ["deadline"], message: "a fixed listing needs an exact deadline; use unresolved if the page does not give one" });
  }
  if (value.deadlineType === "rolling" && value.deadline) {
    ctx.addIssue({ code: "custom", path: ["deadline"], message: "a rolling listing has no deadline" });
  }
  const { minimumAge, maximumAge } = value.eligibility;
  if (minimumAge !== undefined && maximumAge !== undefined && minimumAge > maximumAge) {
    ctx.addIssue({ code: "custom", path: ["eligibility"], message: "minimumAge exceeds maximumAge" });
  }
});

export type SeedCandidate = z.infer<typeof candidateSchema>;
export type SeedCandidateInput = z.input<typeof candidateSchema>;

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(key)) parsed.searchParams.delete(key);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/+$/, "")}${parsed.search}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function normalizedTitleKey(organization: string, title: string): string {
  return `${organization}/${title}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function candidateEligibility(candidate: SeedCandidate): Eligibility {
  const { minimumEducation, educationLevels, ...rest } = candidate.eligibility;
  const levels = educationLevels ?? (minimumEducation ? EDUCATION_ORDER.slice(EDUCATION_ORDER.indexOf(minimumEducation)) : undefined);
  return { ...rest, ...(levels?.length ? { educationLevels: [...levels] } : {}) };
}

export function candidateFindings(candidate: SeedCandidate): TrustChecklist {
  const ugandanOk = ["explicit", "open_to_all_nationalities", "region_includes_uganda"].includes(candidate.ugandanEligibility);
  return {
    sourceAuthentic: true,
    officialApplicationLink: true,
    eligibleForUgandans: ugandanOk,
    noInappropriateFees: candidate.feeAssessment !== "suspicious",
    noSensitiveDataAsk: !candidate.asksSensitiveDataOffPlatform,
    deadlinePlausible: true,
    duplicateChecked: true,
  };
}

export interface BuildOpportunityOptions {
  id: string;
  organizationId: string;
  now: Date;
  reviewerId: string;
  /** "pending" for staging; "verified" for the publish-time visibility check. */
  verificationStatus: "pending" | "verified";
  existingNotes?: string | null;
}

export function candidateToOpportunity(candidate: SeedCandidate, options: BuildOpportunityOptions): Opportunity {
  const verified = options.verificationStatus === "verified";
  const fee = candidate.feeAssessment === "disclosed_official" ? ` Application charge disclosed by the provider${candidate.feeNote ? `: ${candidate.feeNote}` : "."}` : "";
  const notes = [
    `Seeded ${options.now.toISOString().slice(0, 10)} from ${candidate.sourceUrl} (retrieved ${candidate.retrievedAt}).`,
    `Deadline evidence: "${candidate.deadlineQuote}"`,
    `Ugandan eligibility (${candidate.ugandanEligibility}): "${candidate.ugandanEligibilityQuote}"`,
    candidate.leads.length ? `Leads: ${candidate.leads.join(" ")}` : null,
    options.existingNotes ?? null,
  ].filter(Boolean).join("\n");
  return {
    id: options.id,
    title: candidate.title,
    organizationId: options.organizationId,
    organizationName: candidate.organizationName,
    category: candidate.category,
    description: candidate.description,
    eligibility: candidateEligibility(candidate),
    requiredSkills: candidate.requiredSkills,
    preferredSkills: candidate.preferredSkills,
    location: candidate.location,
    workMode: candidate.workMode as WorkMode,
    deadline: candidate.deadline ? new Date(candidate.deadline) : null,
    deadlineType: candidate.deadlineType,
    applicationMethod: `Apply at ${candidate.applicationUrl}. ${candidate.applicationInstructions}${fee}`,
    sourceUrl: candidate.sourceUrl,
    verificationStatus: options.verificationStatus,
    source: "scraped",
    origin: "catalog",
    publicationDate: candidate.publicationDate ? new Date(candidate.publicationDate) : options.now,
    checkedAt: options.now,
    status: "open" as OpportunityStatus,
    reviewChecklist: buildReviewChecklist(candidateFindings(candidate)),
    reviewNotes: notes,
    reviewerId: options.reviewerId,
    reviewedAt: verified ? options.now : null,
  };
}
