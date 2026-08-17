import { z } from "zod";

import { ValidationError } from "@/core/errors/app-error";

const nullableText = z.string().trim().max(240).nullable().optional();
const stringList = z.array(z.string().trim().min(1).max(120)).max(50);
const experience = z.object({ title: z.string().trim().min(1).max(160), organization: z.string().trim().max(160).optional(), months: z.number().int().min(0).max(600) });

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
}).strict();

const eligibilitySchema = z.object({
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
  deadline: z.coerce.date().refine((date) => date > new Date(), "Deadline must be in the future."),
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

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
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
