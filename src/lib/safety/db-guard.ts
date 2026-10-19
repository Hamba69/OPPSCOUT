const ALLOWED_VARIABLE = /^(LOCAL|DEV)_(DATABASE|DIRECT)_URL$/;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "host.docker.internal"]);
const PROJECT_REF = /^[a-z0-9]{20}$/i;

export interface DatabaseTarget {
  variableName: string;
  hostname: string;
  port: number;
  projectRef: string | null;
  isLocal: boolean;
}

export interface DatabaseGuardOptions {
  variableName: string;
  value: string | undefined;
  productionProjectRef?: string;
  repositoryDatabaseUrl?: string;
}

export class UnsafeDatabaseTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeDatabaseTargetError";
  }
}

function parseUrl(value: string | undefined, label: string): URL {
  if (!value) throw new UnsafeDatabaseTargetError(`${label} is missing.`);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new UnsafeDatabaseTargetError(`${label} is not a valid database URL.`);
  }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new UnsafeDatabaseTargetError(`${label} must use PostgreSQL.`);
  }
  return parsed;
}

function isLoopback(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return LOCAL_HOSTS.has(normalized);
}

export function parseSupabaseProjectRef(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = parseUrl(value, "Database URL");
  const host = parsed.hostname.toLowerCase();
  const directHost = host.match(/^db\.([a-z0-9]{20})\.supabase\.co$/);
  if (directHost) return directHost[1];
  if (!host.endsWith(".pooler.supabase.com")) return null;
  const username = decodeURIComponent(parsed.username);
  const userRef = username.match(/^postgres\.([a-z0-9]{20})$/i);
  return userRef?.[1].toLowerCase() ?? null;
}

export function assertSafeDatabaseTarget(options: DatabaseGuardOptions): DatabaseTarget {
  const { variableName } = options;
  if (!ALLOWED_VARIABLE.test(variableName)) {
    throw new UnsafeDatabaseTargetError("Write access must use a LOCAL_*_URL or DEV_*_URL variable.");
  }

  const parsed = parseUrl(options.value, variableName);
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const isLocal = isLoopback(hostname);
  const isLocalVariable = variableName.startsWith("LOCAL_");
  const isDevVariable = variableName.startsWith("DEV_");

  if (isLocal) {
    if (!isLocalVariable && !isDevVariable) {
      throw new UnsafeDatabaseTargetError("Local database access requires an explicit LOCAL_*_URL or DEV_*_URL variable.");
    }
    return {
      variableName,
      hostname,
      port: Number(parsed.port || 5432),
      projectRef: null,
      isLocal: true,
    };
  }

  if (!isDevVariable) {
    throw new UnsafeDatabaseTargetError("Remote database writes require a DEV_*_URL variable.");
  }

  const projectRef = parseSupabaseProjectRef(options.value);
  if (!projectRef) {
    throw new UnsafeDatabaseTargetError("Remote database project reference cannot be determined.");
  }

  const configuredProductionRef = options.productionProjectRef?.trim().toLowerCase();
  if (configuredProductionRef && !PROJECT_REF.test(configuredProductionRef)) {
    throw new UnsafeDatabaseTargetError("PROD_PROJECT_REF is malformed.");
  }

  const repositoryRef = options.repositoryDatabaseUrl
    ? parseSupabaseProjectRef(options.repositoryDatabaseUrl)
    : null;
  if (options.repositoryDatabaseUrl && !repositoryRef) {
    throw new UnsafeDatabaseTargetError("Production project reference from DATABASE_URL cannot be determined.");
  }

  if (!configuredProductionRef && !repositoryRef) {
    throw new UnsafeDatabaseTargetError("Remote database safety cannot be established without a production project reference.");
  }
  if (projectRef === configuredProductionRef || projectRef === repositoryRef) {
    throw new UnsafeDatabaseTargetError("Remote database project matches a configured production reference.");
  }

  return {
    variableName,
    hostname,
    port: Number(parsed.port || 5432),
    projectRef,
    isLocal: false,
  };
}
