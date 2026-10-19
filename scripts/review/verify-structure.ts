import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
const rls = readFileSync(resolve(process.cwd(), "scripts/check-rls.ts"), "utf8");
const requiredModels = [
  "StoredDocument",
  "SeekerAccessLog",
  "SeekerPipelineEntry",
  "Feedback",
  "RequestMetric",
  "WebVitalSample",
  "MatchRun",
  "UnmatchedTerm",
  "AdminAccessLog",
  "MetricRollup",
];
const missing = requiredModels.filter((model) => !new RegExp(`model\\s+${model}\\s+`).test(schema));
console.log(`schemaModels: ${(schema.match(/^model\s+\w+/gm) ?? []).length}`);
console.log(`requiredRlsModels: ${requiredModels.join(", ")}`);
console.log(`missingRequiredModels: ${missing.join(", ") || "none"}`);
console.log(`checkRlsRequiredList: ${requiredModels.every((model) => rls.includes(`"${model}"`)) ? "complete" : "incomplete"}`);
console.log(`rlsUsesLiveDatabase: ${rls.includes("queryRawUnsafe") ? "yes" : "no"}`);
if (missing.length) throw new Error(`Missing schema models: ${missing.join(", ")}`);
