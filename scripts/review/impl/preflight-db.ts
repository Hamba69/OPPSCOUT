import { spawnSync } from "node:child_process";
import { connect } from "node:net";

import { PrismaClient } from "@prisma/client";
import { assertSafeDatabaseTarget } from "@/lib/safety/db-guard";

const timeoutMs = 2_000;

function probe(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host, port });
    const finish = (reachable: boolean) => {
      socket.destroy();
      resolve(reachable);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

function managedContainerState(): "running" | "stopped" | "unavailable" | null {
  let dockerWasAvailable = false;
  for (const name of ["supabase_db_oppscout-local-db", "oppscout-local-db"]) {
    const result = spawnSync("docker", [
      "container",
      "ls",
      "--all",
      "--filter",
      `name=^${name}$`,
      "--format",
      "{{.Names}}|{{.Status}}",
    ], {
      encoding: "utf8",
      timeout: timeoutMs,
      windowsHide: true,
    });
    if (result.error || result.status !== 0) continue;
    dockerWasAvailable = true;
    const row = result.stdout.split(/\r?\n/).find((line) => line.startsWith(`${name}|`));
    if (!row) continue;
    return row.slice(name.length + 1).startsWith("Up") ? "running" : "stopped";
  }
  return dockerWasAvailable ? null : "unavailable";
}

function classifyConnectionError(message: string, variableName: string, username: string, isLocal: boolean): string {
  const roleMissing = message.match(/role ["']([^"']+)["'] does not exist/i);
  if (roleMissing) {
    return [
      `PostgreSQL role "${roleMissing[1]}" does not exist; the URL username is wrong or the local stack needs a reset.`,
      isLocal
        ? "Fix: .\\scripts\\review\\impl\\local-db.ps1 -Action Start; it reloads the local CLI connection URL without printing credentials. If roles remain missing, run .\\scripts\\review\\impl\\local-db.ps1 -Action Start -Reset."
        : `Fix: correct the username in ${variableName} for the owner-provided non-production database; do not use production credentials.`,
    ].join("\n");
  }
  if (/password authentication failed|authentication failed against database server|P1000/i.test(message)) {
    return [
      `PostgreSQL rejected credentials for user "${username}".`,
      isLocal
        ? "Fix: .\\scripts\\review\\impl\\local-db.ps1 -Action Start; it reloads the local CLI URL without printing credentials. If authentication still fails, run .\\scripts\\review\\impl\\local-db.ps1 -Action Start -Reset (this deletes local database data)."
        : `Fix: correct the credentials in ${variableName} with the owner of that non-production database; do not use production credentials.`,
    ].join("\n");
  }
  const missingDatabase = message.match(/database ["']([^"']+)["'] does not exist/i);
  if (missingDatabase) {
    return [
      `PostgreSQL database "${missingDatabase[1]}" does not exist.`,
      isLocal
        ? "Fix: .\\scripts\\review\\impl\\local-db.ps1 -Action Start; it reloads the local connection URL for database postgres."
        : `Fix: correct the database name in ${variableName} with the owner of that non-production database.`,
    ].join("\n");
  }
  const code = message.match(/\bP\d{4}\b/)?.[0] ?? "unknown";
  return `${variableName} reached PostgreSQL as user "${username}", but the connection failed (Prisma ${code}); verify that URL's database name and local credentials without printing them.`;
}

async function checkCredentials(value: string): Promise<string | null> {
  const parsed = new URL(value);
  parsed.searchParams.set("connect_timeout", String(Math.ceil(timeoutMs / 1_000)));
  parsed.searchParams.set("connection_limit", "1");
  process.env.DATABASE_URL = parsed.toString();
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT current_database()`;
    return null;
  } catch (error: unknown) {
    return error instanceof Error ? error.message : "Unclassified PostgreSQL connection error.";
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const requestedName = process.argv[2];
  const variableName = requestedName
    ? requestedName.replace(/^--variable=/, "")
    : process.env.LOCAL_DATABASE_URL
      ? "LOCAL_DATABASE_URL"
      : process.env.LOCAL_DIRECT_URL
        ? "LOCAL_DIRECT_URL"
        : process.env.DEV_DATABASE_URL
          ? "DEV_DATABASE_URL"
          : "DEV_DIRECT_URL";
  const value = process.env[variableName];
  const target = assertSafeDatabaseTarget({
    variableName,
    value,
    productionProjectRef: process.env.PROD_PROJECT_REF,
    repositoryDatabaseUrl: process.env.DATABASE_URL,
  });
  const reachable = await probe(target.hostname, target.port);
  if (!reachable) {
    const containerState = target.isLocal ? managedContainerState() : null;
    if (containerState === "stopped") {
      console.error("The managed local database container is not running.");
      console.error("Fix: .\\scripts\\review\\impl\\local-db.ps1 -Action Start");
    } else if (containerState === "unavailable") {
      console.error("The database port is unreachable and Docker cannot report local container status.");
      console.error("Fix: start Docker Desktop, then run .\\scripts\\review\\impl\\local-db.ps1 -Action Start.");
    } else {
      console.error(`The database port ${target.hostname}:${target.port} is unreachable.`);
      console.error("Fix: .\\scripts\\review\\impl\\local-db.ps1 -Action Start; check Docker Desktop if the port remains unreachable.");
    }
    process.exitCode = 2;
    return;
  }

  const connectionError = await checkCredentials(value!);
  if (connectionError) {
    const username = decodeURIComponent(new URL(value!).username);
    console.error(classifyConnectionError(connectionError, variableName, username, target.isLocal));
    process.exitCode = 2;
    return;
  }
  console.log(`${variableName}: reachable and authenticated (TCP and PostgreSQL checks each bounded to ${timeoutMs} ms).`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Database preflight was blocked.";
  console.error(`Database preflight blocked: ${message}`);
  process.exitCode = 1;
});
