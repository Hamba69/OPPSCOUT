import { spawnSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { PrismaClient } from "@prisma/client";
import { assertSafeDatabaseTarget } from "@/lib/safety/db-guard";

const b2MigrationName = "20261020120000_b2_domain_foundation";
const b2MigrationPath = resolve(process.cwd(), "prisma", "migrations", b2MigrationName);
const heldMigrationPath = resolve(tmpdir(), `${b2MigrationName}-${process.pid}`);
const devUrl = process.env.DEV_DIRECT_URL;
const productionProjectUrls = [
  process.env.DATABASE_URL,
  process.env.DIRECT_URL,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
];

function safeEnvironment(): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: devUrl,
    DIRECT_URL: devUrl,
    OPPSCOUT_PRODUCTION_DATABASE_URL: productionProjectUrls[0],
    OPPSCOUT_PRODUCTION_DIRECT_URL: productionProjectUrls[1],
    OPPSCOUT_PRODUCTION_SUPABASE_URL: productionProjectUrls[2],
  };
  delete environment.DEV_DATABASE_URL;
  return environment;
}

function run(command: string, args: string[], environment: NodeJS.ProcessEnv): number {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: environment,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 180_000,
    windowsHide: true,
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
    .replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, "[database URL redacted]")
    .trim();
  if (output) console.log(output);
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function migrationDeploy(environment: NodeJS.ProcessEnv): number {
  return run(process.execPath, [
    resolve(process.cwd(), "node_modules", "prisma", "build", "index.js"),
    "migrate",
    "deploy",
  ], environment);
}

async function resetPublicSchema(environment: NodeJS.ProcessEnv): Promise<void> {
  process.env.DATABASE_URL = environment.DATABASE_URL;
  process.env.DIRECT_URL = environment.DIRECT_URL;
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS "public" CASCADE');
    await prisma.$executeRawUnsafe('CREATE SCHEMA "public"');
    await prisma.$executeRawUnsafe(
      'GRANT USAGE ON SCHEMA "public" TO postgres, anon, authenticated, service_role',
    );
    await prisma.$executeRawUnsafe(
      'GRANT ALL ON SCHEMA "public" TO postgres, service_role',
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const target = assertSafeDatabaseTarget({
    variableName: "DEV_DIRECT_URL",
    value: devUrl,
    productionProjectRef: process.env.PROD_PROJECT_REF,
    repositoryDatabaseUrl: process.env.DATABASE_URL,
    productionProjectUrls,
  });
  if (
    target.isLocal ||
    target.projectRef !== "rmmwkuihqmezwdugttsr" ||
    !target.hostname.endsWith(".pooler.supabase.com") ||
    target.port !== 5432
  ) {
    throw new Error("B2 preservation rehearsal requires the approved dev session pooler through DEV_DIRECT_URL.");
  }
  if (!existsSync(b2MigrationPath)) throw new Error("The B2 migration directory is missing.");
  if (existsSync(heldMigrationPath)) throw new Error("A prior held B2 migration directory must be resolved first.");

  const environment = safeEnvironment();
  console.log("Resetting only the approved dev project's public schema.");
  await resetPublicSchema(environment);

  console.log("Deploying all Prisma migrations before B2 using DEV_DIRECT_URL.");
  renameSync(b2MigrationPath, heldMigrationPath);
  try {
    const preBatchExitCode = migrationDeploy(environment);
    console.log(`Pre-B2 prisma migrate deploy exit code: ${preBatchExitCode}`);
    if (preBatchExitCode !== 0) throw new Error("Pre-B2 Prisma migrations failed.");
  } finally {
    renameSync(heldMigrationPath, b2MigrationPath);
  }

  console.log("Seeding the catalogue snapshot at the pre-B2 schema.");
  const seedExitCode = run(process.execPath, [
    resolve(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
    "scripts/review/impl/seed-snapshot.ts",
    "--apply",
    "--dev",
  ], environment);
  console.log(`Guarded snapshot seed exit code: ${seedExitCode}`);
  if (seedExitCode !== 0) throw new Error("Guarded snapshot seed failed.");

  console.log("Applying B2 with Prisma migrate deploy using DEV_DIRECT_URL.");
  const b2ExitCode = migrationDeploy(environment);
  console.log(`B2 prisma migrate deploy exit code: ${b2ExitCode}`);
  if (b2ExitCode !== 0) throw new Error("B2 Prisma migration failed.");

  console.log("Comparing every captured catalogue field after B2.");
  const verifyExitCode = run(process.execPath, [
    resolve(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
    "scripts/migration-rehearsal.ts",
    "--verify-dev-snapshot-only",
  ], environment);
  console.log(`Field-by-field snapshot verification exit code: ${verifyExitCode}`);
  if (verifyExitCode !== 0) throw new Error("Field-by-field snapshot verification failed.");
  console.log(`B2 dev migration-preservation rehearsal passed for ${target.projectRef}.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "B2 dev preservation rehearsal failed.";
  console.error(message.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, "[database URL redacted]"));
  process.exitCode = 1;
});
