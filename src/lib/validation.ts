import { z } from "zod";

import { ValidationError } from "@/core/errors/app-error";

export const ORG_SHARING_CONSENT_VERSION = "2026-10-v1";

const nullableText = z.string().trim().max(240).nullable().optional();
const stringList = z.array(z.string().trim().min(1).max(120)).max(50);
const experience = z.object({ title: z.string().trim().min(1).max(160), organization: z.string().trim().max(160).optional(), months: z.number().int().min(0).max(600) });
const plainText = (max: number, min = 0) => z.string().trim().max(max)
  .transform((value) => value.replace(/[\u0000-\u001f\u007f]/g, ""))
  .refine((value) => value.trim().length >= min, `Must be at least ${min} characters.`);
const publicHttpsUrl = z.string().trim().max(300).url().refine((value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !["javascript:", "data:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}, "Use a public HTTPS URL without login credentials.");
const isGithubProfile = (value: string): boolean => {
  const parsed = new URL(value);
  const host = parsed.hostname.toLowerCase();
  const username = parsed.pathname.replace(/^\/|\/$/g, "");
  return host === "github.com" && /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(username);
};
const githubUrl = publicHttpsUrl.refine(isGithubProfile, "Use a valid github.com profile URL.").transform((value) => {
  const username = new URL(value).pathname.replace(/^\/|\/$/g, "");
  return `https://github.com/${username}`;
});
const profileLink = z.object({ label: plainText(80, 1), url: publicHttpsUrl }).strict();
const project = z.object({
  title: plainText(80, 3),
  description: plainText(500),
  url: publicHttpsUrl.optional(),
  role: plainText(120).optional(),
  tags: z.array(plainText(30, 1)).max(8),
}).strict();

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: nullableText,
  email: z.string().email().nullable().optional(),
  preferredChannel: z.enum(["web", "email", "sms", "ussd"]).optional(),
  secondaryChannels: z.array(z.enum(["web", "email", "sms", "ussd"])).max(4).optional(),
  notificationsEnabled: z.boolean().optional(),
  notificationFrequency: z.enum(["instant", "daily", "weekly"]).optional(),
  educationLevel: nullableText,
  institution: nullableText,
  fieldOfStudy: nullableText,
  graduationStatus: nullableText,
  dateOfBirth: z.coerce.date().max(new Date(), "Date of birth cannot be in the future.").nullable().optional(),
  skills: stringList.optional(),
  workExperience: z.array(experience).max(30).optional(),
  internshipExperience: z.array(experience).max(30).optional(),
  certifications: stringList.optional(),
  location: nullableText,
  preferredLocations: stringList.optional(),
  careerInterests: stringList.optional(),
  opportunityCategories: stringList.optional(),
  workModePreference: z.enum(["remote", "onsite", "hybrid"]).nullable().optional(),
  languages: stringList.optional(),
  githubUrl: githubUrl.nullable().optional(),
  portfolioUrl: publicHttpsUrl.nullable().optional(),
  otherLinks: z.array(profileLink).max(3).optional(),
  projects: z.array(project).max(6).optional(),
  shareWithOrganizations: z.boolean().optional(),
  shareContactDetails: z.boolean().optional(),
  orgSharingConsentAt: z.coerce.date().nullable().optional(),
  orgSharingConsentVersion: z.string().max(40).nullable().optional(),
}).strict();

export const eligibilitySchema = z.object({
  additionalRequirements: z.array(z.string().trim().min(1).max(500)).max(30).optional(),
  educationLevels: stringList.optional(),
  fieldsOfStudy: stringList.optional(),
  minimumExperienceMonths: z.number().int().min(0).max(600).optional(),
  minimumAge: z.number().int().min(13).max(100).optional(),
  maximumAge: z.number().int().min(13).max(100).optional(),
  mandatoryCertifications: stringList.optional(),
  programmeRules: z.array(z.object({
    field: z.enum(["graduationStatus", "location", "language"]),
    allowedValues: stringList,
    label: z.string().trim().min(1).max(160),
  })).max(20).optional(),
}).strict().refine((value) => value.minimumAge === undefined || value.maximumAge === undefined || value.minimumAge <= value.maximumAge, {
  message: "minimumAge cannot exceed maximumAge",
});

export const opportunitySchema = z.object({
  title: z.string().trim().min(4).max(180),
  organizationId: z.string().uuid(),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(20).max(12_000),
  eligibility: eligibilitySchema,
  requiredSkills: stringList.default([]),
  preferredSkills: stringList.default([]),
  location: z.string().trim().min(2).max(120),
  workMode: z.enum(["remote", "onsite", "hybrid"]),
  deadline: z.union([
    z.coerce.date().refine((date) => date > new Date(), "Deadline must be in the future.").nullable(),
    z.literal("").transform(() => null),
  ]),
  applicationMethod: z.string().trim().min(5).max(500),
  sourceUrl: z.string().url().refine((url) => url.startsWith("https://"), "Official source URL must use HTTPS."),
  verificationStatus: z.enum(["unverified", "pending", "verified", "flagged"]).default("pending"),
  source: z.enum(["org_submitted", "scraped", "partner_feed"]).default("org_submitted"),
  status: z.enum(["open", "closing_soon", "closed", "stale", "removed"]).default("open"),
}).strict();

export const organizationSchema = z.object({
  name: z.string().trim().min(2).max(180),
  sector: z.string().trim().min(2).max(120),
  officialLinks: z.array(z.string().url()).min(1).max(10),
  officialEmail: z.string().email().nullable(),
  registrationProof: z.string().trim().min(3).max(500).nullable(),
  accountableContact: z.string().trim().min(2).max(180).nullable(),
}).strict();

export const profileDocumentSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(300).optional(),
  fileName: z.string().trim().min(1).max(120),
  mimeType: z.string().trim().min(1).max(160),
  sizeBytes: z.number().int().positive(),
}).strict();

export const reportSchema = z.object({
  opportunityId: z.string().uuid(),
  reason: z.string().trim().min(3).max(200),
  details: z.string().trim().max(2_000).optional(),
}).strict();

export const trustChecklistSchema = z.object({
  sourceAuthentic: z.boolean(),
  noInappropriateFees: z.boolean(),
  noSensitiveDataAsk: z.boolean(),
  deadlinePlausible: z.boolean(),
  duplicateChecked: z.boolean(),
}).strict();

export async function parseJson<TSchema extends z.ZodTypeAny>(request: Request, schema: TSchema): Promise<z.output<TSchema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
  const result = schema.safeParse(body);
  if (!result.success) throw new ValidationError("Request validation failed.", result.error.flatten());
  return result.data;
}
