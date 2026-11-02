import { Prisma, PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

import { assertSafeDatabaseTarget } from "@/lib/safety/db-guard";

const snapshotPath = resolve(process.cwd(), "docs/audits/catalog-snapshot.json");
const apply = process.argv.includes("--apply");
const useDevDatabase = process.argv.includes("--dev");
const snapshotSchema = z.object({
  capturedAt: z.string().datetime(),
  total: z.number().int().nonnegative(),
  opportunities: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    organizationId: z.string().uuid().nullable(),
    category: z.string(),
    description: z.string(),
    eligibility: z.unknown(),
    requiredSkills: z.array(z.string()),
    preferredSkills: z.array(z.string()),
    location: z.string(),
    workMode: z.enum(["remote", "onsite", "hybrid", "unknown"]),
    deadline: z.string().nullable(),
    applicationMethod: z.string(),
    sourceUrl: z.string(),
    verificationStatus: z.enum(["unverified", "pending", "verified", "flagged"]),
    source: z.enum(["org_submitted", "scraped", "partner_feed"]),
    publicationDate: z.string(),
    checkedAt: z.string(),
    status: z.enum(["open", "closing_soon", "closed", "stale", "removed"]),
    reviewChecklist: z.unknown(),
    reviewNotes: z.string().nullable(),
    reviewerId: z.string().nullable(),
    reviewedAt: z.string().nullable(),
  })),
});

type SnapshotOpportunity = z.infer<typeof snapshotSchema>["opportunities"][number];

function isJsonValue(value: unknown): value is Prisma.InputJsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (typeof value !== "object") return false;
  return Object.values(value).every(isJsonValue);
}

function snapshotDate(value: string | null): Date | null {
  if (value === null) return null;
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  const result = new Date(normalized);
  if (!Number.isFinite(result.getTime())) throw new Error("Snapshot contains an invalid timestamp.");
  return result;
}

function requiredDate(value: string): Date {
  const result = snapshotDate(value);
  if (!result) throw new Error("Snapshot contains a missing required timestamp.");
  return result;
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  if (!isJsonValue(value) || value === null) throw new Error("Snapshot contains a non-object JSON field.");
  return value as Prisma.InputJsonValue;
}

function loadSnapshot() {
  const raw = readFileSync(snapshotPath, "utf8");
  const data = snapshotSchema.parse(JSON.parse(raw));
  if (data.total !== data.opportunities.length) {
    throw new Error("Snapshot total does not match its opportunity count.");
  }
  for (const opportunity of data.opportunities) {
    if (!isJsonValue(opportunity.eligibility) || !isJsonValue(opportunity.reviewChecklist)) {
      throw new Error("Snapshot contains non-JSON opportunity fields.");
    }
  }
  return { raw, data };
}

async function seed(data: ReturnType<typeof loadSnapshot>["data"], fingerprint: string): Promise<void> {
  const variableName = useDevDatabase ? "DEV_DIRECT_URL" : "LOCAL_DATABASE_URL";
  const value = process.env[variableName];
  const productionDatabaseUrl = useDevDatabase
    ? process.env.OPPSCOUT_PRODUCTION_DATABASE_URL
    : process.env.DATABASE_URL;
  const productionProjectUrls = useDevDatabase
    ? [
        process.env.OPPSCOUT_PRODUCTION_DATABASE_URL,
        process.env.OPPSCOUT_PRODUCTION_DIRECT_URL,
        process.env.OPPSCOUT_PRODUCTION_SUPABASE_URL,
      ]
    : undefined;
  const target = assertSafeDatabaseTarget({
    variableName,
    value,
    productionProjectRef: process.env.PROD_PROJECT_REF,
    repositoryDatabaseUrl: productionDatabaseUrl,
    productionProjectUrls,
  });
  if (useDevDatabase) {
    if (target.isLocal || target.projectRef !== "rmmwkuihqmezwdugttsr") {
      throw new Error("Snapshot seed requires the explicitly approved remote dev project through DEV_DIRECT_URL.");
    }
  } else {
    const direct = assertSafeDatabaseTarget({
      variableName: "LOCAL_DIRECT_URL",
      value: process.env.LOCAL_DIRECT_URL,
      productionProjectRef: process.env.PROD_PROJECT_REF,
      repositoryDatabaseUrl: productionDatabaseUrl,
    });
    if (!target.isLocal || !direct.isLocal || target.hostname !== direct.hostname || target.port !== direct.port) {
      throw new Error("Snapshot seed requires matching loopback-only LOCAL_DATABASE_URL and LOCAL_DIRECT_URL values.");
    }
  }

  process.env.DATABASE_URL = value;
  process.env.DIRECT_URL = value;
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.opportunity.count();
    if (existing !== 0) throw new Error("Snapshot seed requires an empty Opportunity table.");

    const organizationIds = [...new Set(data.opportunities.map((opportunity) => opportunity.organizationId).filter((id): id is string => id !== null))];
    const timestamp = requiredDate(data.capturedAt);
    const opportunityRows = data.opportunities.map((opportunity: SnapshotOpportunity) => ({
      id: opportunity.id,
      title: opportunity.title,
      organizationId: opportunity.organizationId,
      category: opportunity.category,
      description: opportunity.description,
      eligibility: jsonValue(opportunity.eligibility),
      requiredSkills: opportunity.requiredSkills,
      preferredSkills: opportunity.preferredSkills,
      location: opportunity.location,
      workMode: opportunity.workMode,
      deadline: snapshotDate(opportunity.deadline),
      applicationMethod: opportunity.applicationMethod,
      sourceUrl: opportunity.sourceUrl,
      verificationStatus: opportunity.verificationStatus,
      source: opportunity.source,
      origin: "catalog" as const,
      publicationDate: requiredDate(opportunity.publicationDate),
      checkedAt: requiredDate(opportunity.checkedAt),
      status: opportunity.status,
      reviewChecklist: jsonValue(opportunity.reviewChecklist),
      reviewNotes: opportunity.reviewNotes,
      reviewerId: opportunity.reviewerId,
      reviewedAt: snapshotDate(opportunity.reviewedAt),
    }));
    const actual = await prisma.$transaction(async (transaction) => {
      await transaction.organization.createMany({
        data: organizationIds.map((id) => ({
          id,
          name: `Snapshot fixture ${id}`,
          sector: "Synthetic fixture label; source snapshot did not include organization names.",
          verificationStatus: "pending",
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      });
      await transaction.opportunity.createMany({ data: opportunityRows });
      return transaction.opportunity.count();
    });
    if (actual !== data.total) throw new Error(`Snapshot seed count mismatch: expected ${data.total}, got ${actual}.`);

    writeFileSync(resolve(process.cwd(), "docs/audits/migration-rehearsal-seed.json"), `${JSON.stringify({
      snapshotCapturedAt: data.capturedAt,
      snapshotSha256: fingerprint,
      opportunities: actual,
      organizations: organizationIds.length,
      organizationLabelsAreSynthetic: true,
      sourceNamesWereNotPresentInSnapshot: true,
      databaseTarget: `${target.hostname}:${target.port}`,
    }, null, 2)}\n`, "utf8");
    console.log(`Seeded ${actual} snapshot opportunities and ${organizationIds.length} synthetic organization reference rows.`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const unsupported = process.argv.slice(2).filter((argument) => argument !== "--apply" && argument !== "--dev");
  if (unsupported.length) throw new Error(`Unsupported arguments: ${unsupported.join(", ")}.`);
  const { raw, data } = loadSnapshot();
  const fingerprint = createHash("sha256").update(raw).digest("hex");
  if (!apply) {
    console.log(`Dry run: snapshot ${data.capturedAt}; ${data.total} opportunities; SHA-256 ${fingerprint}. No database connection or write.`);
    return;
  }
  await seed(data, fingerprint);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Snapshot seeding failed.";
  console.error(`Snapshot seed stopped: ${message}`);
  process.exitCode = 1;
});
