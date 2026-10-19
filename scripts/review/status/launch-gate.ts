import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const dbUrl = process.env.DATABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const required = [
  "200 live Uganda-relevant listings",
  "150 performed in Uganda",
  "no origin above 10 before gate then 5% after gate",
  "at least 20 distinct organisations",
  "org_attested <= 25%",
  "report response within 24h for 95%",
  "audience gate enforced with shadow diff reviewed",
  "dead-link rate < 2%, freshness error < 1%",
];

console.log("Launch gate conditions:");
for (const item of required) console.log(`- ${item}: UNVERIFIABLE`);
if (dbUrl) {
  console.log(`DATABASE_URL present: ${dbUrl.includes("postgres") ? "read-only candidate" : "present"}`);
} else {
  console.log("No read-only DATABASE_URL detected in the environment.");
}
console.log("Status: UNVERIFIABLE without a live read-only database or deployment output.");
console.log(`Gate script path: ${resolve(root, "scripts/review/status/launch-gate.ts")}`);
console.log(`checkRlsScriptExists: ${existsSync(resolve(root, "scripts/check-rls.ts")) ? "yes" : "no"}`);
