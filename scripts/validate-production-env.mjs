const baseRequired = [
  "DATABASE_URL",
  "DIRECT_URL",
  "OPPSCOUT_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "USSD_TOKEN_SECRET",
  "AFRICASTALKING_USSD_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "OPPSCOUT_EMAIL_FROM",
  "AFRICASTALKING_USERNAME",
  "AFRICASTALKING_API_KEY",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_API_KEY",
  "OPPSCOUT_SCRAPER_SHADOW_BUCKET",
  "OPPSCOUT_AI_DEFAULT",
  "OPPSCOUT_AI_COMPARISON_APPROVED",
  "OPPSCOUT_MONETIZATION_LEGAL_REVIEW",
  "OPPSCOUT_MIN_ORG_RETENTION_PERCENT",
  "OPPSCOUT_MAX_TRUST_TURNAROUND_HOURS",
  "OPPSCOUT_MIN_ORG_SAMPLE",
  "NOTIFICATION_DAILY_CAP",
  "RATE_LIMIT_USER_PER_MINUTE",
  "RATE_LIMIT_ORGANIZATION_PER_MINUTE",
  "RATE_LIMIT_ADMIN_PER_MINUTE",
  "RATE_LIMIT_USSD_PER_MINUTE",
];

const optionalGates = [
  ["OPPSCOUT_AI_DEFAULT", "ANTHROPIC_API_KEY"],
  ["OPPSCOUT_AI_DEFAULT", "OPPSCOUT_AI_COMPARISON_APPROVED"],
];

const missing = baseRequired.filter((name) => !process.env[name] || String(process.env[name]).trim() === "");
for (const [gate, name] of optionalGates) {
  if (process.env[gate] === "true" && (!process.env[name] || String(process.env[name]).trim() === "")) {
    missing.push(name);
  }
}

if (process.env.OPPSCOUT_AI_DEFAULT === "true" && process.env.OPPSCOUT_AI_COMPARISON_APPROVED !== "true") {
  console.error("AI default is blocked until OPPSCOUT_AI_COMPARISON_APPROVED=true.");
  process.exitCode = 1;
}

if (process.env.DATABASE_URL && process.env.DIRECT_URL) {
  try {
    const runtime = new URL(process.env.DATABASE_URL);
    const direct = new URL(process.env.DIRECT_URL);
    const connectionLimit = Number(runtime.searchParams.get("connection_limit"));
    if (runtime.port !== "6543" || !runtime.hostname.includes(".pooler.supabase.com") ||
      runtime.searchParams.get("pgbouncer") !== "true" || !Number.isInteger(connectionLimit) || connectionLimit < 1 || connectionLimit > 5) {
      console.error("DATABASE_URL must use the Supabase transaction pooler on port 6543 with pgbouncer=true and connection_limit between 1 and 5.");
      process.exitCode = 1;
    }
    if (direct.port !== "5432" || !direct.hostname.startsWith("db.") || direct.searchParams.get("pgbouncer")) {
      console.error("DIRECT_URL must use the Supabase direct database connection on port 5432 without pgbouncer.");
      process.exitCode = 1;
    }
  } catch {
    console.error("DATABASE_URL and DIRECT_URL must be valid PostgreSQL URLs.");
    process.exitCode = 1;
  }
}

if (missing.length) {
  console.error(`Missing production variables: ${[...new Set(missing)].sort().join(", ")}`);
  process.exitCode = 1;
} else if (!process.exitCode) {
  console.log("Production environment variable names are complete. Values were not printed.");
}
