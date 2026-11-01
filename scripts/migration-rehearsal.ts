import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { assertSafeDatabaseTarget } from "@/lib/safety/db-guard";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const verifySnapshotOnly = args.includes("--verify-snapshot-only");
const unsupported = args.filter((argument) => argument !== "--apply" && argument !== "--verify-snapshot-only");
const snapshotPath = resolve(process.cwd(), "docs/audits/catalog-snapshot.json");
const resultPath = resolve(process.cwd(), "docs/audits/migration-rehearsal-results.json");
const snapshotSchema = z.object({
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

function connectionIdentity(value: string | undefined, variableName: string) {
  if (!value) throw new Error(`${variableName} is required when applying the rehearsal.`);
  const target = assertSafeDatabaseTarget({
    variableName,
    value,
    productionProjectRef: process.env.PROD_PROJECT_REF,
    repositoryDatabaseUrl: process.env.DATABASE_URL,
  });
  if (!target.isLocal) throw new Error(`${variableName} must point to loopback for migration rehearsal.`);
  const parsed = new URL(value);
  return {
    target,
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
  };
}

function migrationFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return migrationFiles(path);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".sql") ? [path] : [];
  }).sort();
}

function sanitize(value: string): string {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, "[database URL redacted]")
    .replace(/(LOCAL_DB_PASSWORD\s*[=:]\s*)[^\s]+/gi, "$1[redacted]")
    .replace(/(password\s*[=:]\s*)[^\s]+/gi, "$1[redacted]");
}

function outputLines(value: string): string[] {
  return sanitize(value).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function writeRehearsalResult(record: Record<string, unknown>): void {
  mkdirSync(resolve(process.cwd(), "docs/audits"), { recursive: true });
  const previous = existsSync(resultPath)
    ? JSON.parse(readFileSync(resultPath, "utf8")) as Record<string, unknown>
    : {};
  const localStackAttempts = record.localStackAttempts ?? previous.localStackAttempts;
  writeFileSync(
    resultPath,
    `${JSON.stringify({
      ...record,
      ...(localStackAttempts ? { localStackAttempts } : {}),
    }, null, 2)}\n`,
    "utf8",
  );
}

function recordSnapshotVerification(record: Record<string, unknown>): void {
  const previous = existsSync(resultPath)
    ? JSON.parse(readFileSync(resultPath, "utf8")) as Record<string, unknown>
    : {};
  writeRehearsalResult({ ...previous, snapshotVerificationResult: record });
}

function normalize(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return `[${value.map(normalize).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${normalize(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function snapshotDate(value: string | null): Date | null {
  if (value === null) return null;
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  if (!Number.isFinite(date.getTime())) throw new Error("Snapshot contains an invalid timestamp.");
  return date;
}

async function verifySnapshot(): Promise<{ count: number; digest: string } | null> {
  const snapshot = snapshotSchema.parse(JSON.parse(readFileSync(snapshotPath, "utf8")));
  if (snapshot.total !== snapshot.opportunities.length) {
    throw new Error("Snapshot total does not match its opportunity count.");
  }
  const prisma = new PrismaClient();
  try {
    const count = await prisma.opportunity.count();
    if (count === 0) return null;
    if (count !== snapshot.total) {
      throw new Error(`Local Opportunity count differs from the snapshot (${count} vs ${snapshot.total}).`);
    }
    const rows = await prisma.opportunity.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        title: true,
        organizationId: true,
        category: true,
        description: true,
        eligibility: true,
        requiredSkills: true,
        preferredSkills: true,
        location: true,
        workMode: true,
        deadline: true,
        applicationMethod: true,
        sourceUrl: true,
        verificationStatus: true,
        source: true,
        origin: true,
        publicationDate: true,
        checkedAt: true,
        status: true,
        reviewChecklist: true,
        reviewNotes: true,
        reviewerId: true,
        reviewedAt: true,
      },
    });
    const expectedById = new Map(snapshot.opportunities.map((opportunity) => [opportunity.id, opportunity]));
    for (const row of rows) {
      const expected = expectedById.get(row.id);
      if (!expected) throw new Error(`Unexpected Opportunity row in the local seed: ${row.id}.`);
      const expectedProjection = {
        ...expected,
        deadline: snapshotDate(expected.deadline),
        publicationDate: snapshotDate(expected.publicationDate),
        checkedAt: snapshotDate(expected.checkedAt),
        reviewedAt: snapshotDate(expected.reviewedAt),
        origin: "catalog",
      };
      const fields = Object.keys(expectedProjection) as Array<keyof typeof expectedProjection>;
      const mismatches = fields.filter((field) => normalize(row[field]) !== normalize(expectedProjection[field]));
      if (mismatches.length) {
        throw new Error(`Snapshot row ${row.id} changed in fields: ${mismatches.join(", ")}.`);
      }
    }
    const digest = createHash("sha256").update(rows.map((row) => normalize(row)).join("\n")).digest("hex");
    return { count, digest };
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  if (unsupported.length) throw new Error(`Unsupported arguments: ${unsupported.join(", ")}.`);
  if (apply && verifySnapshotOnly) throw new Error("--apply and --verify-snapshot-only cannot be used together.");
  if (verifySnapshotOnly) {
    const verificationStartedAt = new Date();
    const verificationStarted = Date.now();
    const regular = connectionIdentity(process.env.LOCAL_DATABASE_URL, "LOCAL_DATABASE_URL");
    const direct = connectionIdentity(process.env.LOCAL_DIRECT_URL, "LOCAL_DIRECT_URL");
    if (regular.target.hostname !== direct.target.hostname
      || regular.target.port !== direct.target.port
      || regular.database !== direct.database) {
      throw new Error("LOCAL_DATABASE_URL and LOCAL_DIRECT_URL must address the same local database.");
    }
    process.env.DATABASE_URL = process.env.LOCAL_DATABASE_URL;
    process.env.DIRECT_URL = process.env.LOCAL_DIRECT_URL;
    let snapshotResult: { count: number; digest: string } | null;
    try {
      snapshotResult = await verifySnapshot();
      if (!snapshotResult) throw new Error("Snapshot verification requires seeded Opportunity rows.");
    } catch (error: unknown) {
      recordSnapshotVerification({
        command: "npm run impl:migration-rehearsal -- --verify-snapshot-only",
        startedAt: verificationStartedAt.toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - verificationStarted,
        exitCode: 1,
        target: {
          hostname: regular.target.hostname,
          port: regular.target.port,
          database: regular.database,
        },
        failure: sanitize(error instanceof Error ? error.message : "Snapshot verification failed."),
      });
      throw error;
    }
    recordSnapshotVerification({
      command: "npm run impl:migration-rehearsal -- --verify-snapshot-only",
      startedAt: verificationStartedAt.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - verificationStarted,
      exitCode: 0,
      target: {
        hostname: regular.target.hostname,
        port: regular.target.port,
        database: regular.database,
      },
      snapshotOpportunitiesUnchanged: snapshotResult.count,
      rowDigestSha256: snapshotResult.digest,
    });
    console.log(`Verified all ${snapshotResult.count} seeded snapshot opportunities are unchanged.`);
    console.log(`Snapshot row digest: ${snapshotResult.digest}`);
    return;
  }
  if (!apply) {
    console.log("Dry run: no database connection or writes. Set LOCAL_DATABASE_URL and LOCAL_DIRECT_URL, run preflight, then pass --apply to deploy migrations to a local database.");
    console.log("After deployment, seeded Opportunity rows are compared field-by-field with the source snapshot.");
    return;
  }

  const startedAt = new Date();
  const started = Date.now();
  let target: { hostname: string; port: number; database: string } | null = null;
  let commandOutput = "";
  let failureStage = "validate target";
  let prismaMigrationExitCode: number | null = null;
  let prismaMigrations: string[] = [];
  let localOpportunityCount: number | null = null;
  let organizationNameColumnExists: boolean | null = null;
  let mirrorMigrationExitCode: number | null = null;
  let mirrorMigrationFiles: string[] = [];
  const completedSteps: string[] = [];
  try {
    const regular = connectionIdentity(process.env.LOCAL_DATABASE_URL, "LOCAL_DATABASE_URL");
    const direct = connectionIdentity(process.env.LOCAL_DIRECT_URL, "LOCAL_DIRECT_URL");
    if (regular.target.hostname !== direct.target.hostname
      || regular.target.port !== direct.target.port
      || regular.database !== direct.database) {
      throw new Error("LOCAL_DATABASE_URL and LOCAL_DIRECT_URL must address the same local database.");
    }
    target = {
      hostname: regular.target.hostname,
      port: regular.target.port,
      database: regular.database,
    };

    const environment = { ...process.env };
    environment.DATABASE_URL = process.env.LOCAL_DATABASE_URL;
    environment.DIRECT_URL = process.env.LOCAL_DIRECT_URL;
    delete environment.AUDIT_DB_URL;
    delete environment.DEV_DATABASE_URL;
    delete environment.DEV_DIRECT_URL;
    process.env.DATABASE_URL = environment.DATABASE_URL;
    process.env.DIRECT_URL = environment.DIRECT_URL;

    const prismaCli = resolve(process.cwd(), "node_modules", "prisma", "build", "index.js");
    failureStage = "Prisma migrate deploy";
    const prismaResult = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
      cwd: process.cwd(),
      env: environment,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
    });
    commandOutput = `${prismaResult.stdout ?? ""}\n${prismaResult.stderr ?? ""}`;
    if (prismaResult.error) throw prismaResult.error;
    prismaMigrationExitCode = prismaResult.status ?? 1;
    if (prismaResult.status !== 0) {
      throw new Error(`Prisma migration deployment failed with exit code ${prismaResult.status ?? 1}: ${outputLines(commandOutput).slice(-8).join(" | ")}`);
    }
    for (const line of outputLines(commandOutput)) console.log(line);
    completedSteps.push("prisma migrate deploy");

    const mirrors = migrationFiles(resolve(process.cwd(), "supabase", "migrations"));
    const mirrorDirectory = resolve(process.cwd(), "supabase", "migrations");
    mirrorMigrationFiles = mirrors.map((path) => path.slice(mirrorDirectory.length + 1));

    failureStage = "read applied Prisma migrations";
    const prisma = new PrismaClient();
    try {
      const rows = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name
        FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
        ORDER BY migration_name
      `;
      prismaMigrations = rows.map((row) => row.migration_name);
      localOpportunityCount = await prisma.opportunity.count();
      const columnRows = await prisma.$queryRaw<Array<{ column_exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'Opportunity'
            AND column_name = 'organizationName'
        ) AS column_exists
      `;
      organizationNameColumnExists = columnRows[0]?.column_exists ?? false;
    } finally {
      await prisma.$disconnect();
    }
    completedSteps.push("read applied Prisma migration history");

    if (mirrors.length) {
      failureStage = "Supabase mirror migrations";
      const mirrorResult = spawnSync("supabase", ["migration", "up", "--local", "--workdir", process.cwd()], {
        cwd: process.cwd(),
        env: environment,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 120_000,
      });
      const mirrorOutput = `${mirrorResult.stdout ?? ""}\n${mirrorResult.stderr ?? ""}`;
      commandOutput += `\n${mirrorOutput}`;
      if (mirrorResult.error) throw mirrorResult.error;
      mirrorMigrationExitCode = mirrorResult.status ?? 1;
      if (mirrorMigrationExitCode !== 0) {
        throw new Error(`Supabase mirror migrations failed with exit code ${mirrorMigrationExitCode}: ${outputLines(mirrorOutput).slice(-8).join(" | ")}`);
      }
      for (const line of outputLines(mirrorOutput)) console.log(line);
      completedSteps.push("apply Supabase mirror migrations");
    }

    failureStage = "verify seeded catalog snapshot";
    const snapshotResult = await verifySnapshot();
    completedSteps.push("verify seeded catalog snapshot");
    const completedAt = new Date();
    const lines = outputLines(commandOutput);
    const resultRecord = {
      command: "npm run impl:migration-rehearsal -- --apply",
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: Date.now() - started,
      exitCode: 0,
      target,
      prismaMigrationExitCode,
      prismaMigrationCount: prismaMigrations.length,
      prismaMigrations,
      localOpportunityCount,
      organizationNameColumnExists,
      supabaseMirrorMigrations: mirrorMigrationFiles,
      supabaseMirrorMigrationExitCode: mirrorMigrationExitCode,
      completedSteps,
      snapshotOpportunitiesUnchanged: snapshotResult?.count ?? null,
      rowDigestSha256: snapshotResult?.digest ?? null,
      firstOutput: lines[0] ?? "(no output)",
      lastOutput: lines.at(-1) ?? "(no output)",
    };
    writeRehearsalResult(resultRecord);
    console.log("Migrations applied to the guarded local database.");
    if (snapshotResult) {
      console.log(`Verified all ${snapshotResult.count} seeded snapshot opportunities are unchanged.`);
    } else {
      console.log("No snapshot rows found; seed from docs/audits/catalog-snapshot.json and rerun to verify row preservation.");
    }
  } catch (error: unknown) {
    const message = sanitize(error instanceof Error ? error.message : "Migration rehearsal failed.");
    const lines = outputLines(commandOutput);
    const recordedLines = lines.length ? lines : outputLines(message);
    const failureRecord = {
      command: "npm run impl:migration-rehearsal -- --apply",
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      exitCode: 1,
      target,
      failureStage,
      failure: message,
      prismaMigrationExitCode,
      prismaMigrationCount: prismaMigrations.length,
      prismaMigrations,
      localOpportunityCount,
      organizationNameColumnExists,
      supabaseMirrorMigrations: mirrorMigrationFiles,
      supabaseMirrorMigrationExitCode: mirrorMigrationExitCode,
      completedSteps,
      snapshotVerification: "not reached",
      firstOutput: recordedLines[0] ?? "(no output)",
      lastOutput: recordedLines.at(-1) ?? "(no output)",
    };
    writeRehearsalResult(failureRecord);
    console.error(message);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(sanitize(error instanceof Error ? error.message : "Migration rehearsal failed."));
  process.exitCode = 1;
});
