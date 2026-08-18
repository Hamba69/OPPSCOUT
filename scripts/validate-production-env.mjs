const baseRequired = [
  "DATABASE_URL",
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
];

const optionalGates = [
  ["OPPSCOUT_AI_DEFAULT", "ANTHROPIC_API_KEY"],
  ["OPPSCOUT_AI_DEFAULT", "OPPSCOUT_AI_COMPARISON_APPROVED"],
];

const missing = baseRequired.filter((name) => !process.env[name]);
for (const [gate, name] of optionalGates) {
  if (process.env[gate] === "true" && process.env[name] !== "true" && !process.env[name]) missing.push(name);
}
if (process.env.OPPSCOUT_DATA_MODE && process.env.OPPSCOUT_DATA_MODE !== "prisma") {
  console.error("OPPSCOUT_DATA_MODE must be prisma for production.");
  process.exitCode = 1;
}
if (process.env.OPPSCOUT_AI_DEFAULT === "true" && process.env.OPPSCOUT_AI_COMPARISON_APPROVED !== "true") {
  console.error("AI default is blocked until OPPSCOUT_AI_COMPARISON_APPROVED=true.");
  process.exitCode = 1;
}
if (missing.length) {
  console.error(`Missing production variables: ${[...new Set(missing)].sort().join(", ")}`);
  process.exitCode = 1;
} else if (!process.exitCode) {
  console.log("Production environment variable names are complete. Values were not printed.");
}
