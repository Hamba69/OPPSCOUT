const ALLOWED_VARIABLE = /^(LOCAL|DEV)_(DATABASE|DIRECT)_URL$/;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "host.docker.internal"]);
const PROJECT_REF = /^[a-z0-9]{20}$/i;
const ALLOWED_DEV_PROJECT_REFS = new Set(["rmmwkuihqmezwdugttsr"]);

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
  productionProjectUrls?: Array<string | undefined>;
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

function parseProjectRefFromConfiguredUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      const match = parsed.hostname.toLowerCase().match(/^([a-z0-9]{20})\.supabase\.co$/);
      return match?.[1] ?? null;
    }
    return parseSupabaseProjectRef(value);
  } catch {
    return null;
  }
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
  if (!ALLOWED_DEV_PROJECT_REFS.has(projectRef)) {
    throw new UnsafeDatabaseTargetError("Remote database project is not on the explicit development allowlist.");
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

  const configuredProductionUrls = options.productionProjectUrls ?? [
    process.env.DATABASE_URL,
    process.env.DIRECT_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ];
  const productionRefs = configuredProductionUrls
    .filter((value): value is string => Boolean(value))
    .map(parseProjectRefFromConfiguredUrl);
  if (productionRefs.some((ref) => ref === null)) {
    throw new UnsafeDatabaseTargetError("A configured production project reference cannot be determined.");
  }
  const knownProductionRefs = new Set([
    ...(configuredProductionRef ? [configuredProductionRef] : []),
    ...(repositoryRef ? [repositoryRef] : []),
    ...productionRefs.filter((ref): ref is string => ref !== null),
  ]);

  if (knownProductionRefs.has(projectRef)) {
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
