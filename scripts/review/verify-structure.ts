import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
const rls = readFileSync(resolve(process.cwd(), "scripts/check-rls.ts"), "utf8");
const models = [...schema.matchAll(/^model\s+(\w+)/gm)].map((match) => match[1]);
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
const missing = requiredModels.filter((model) => !models.includes(model));
const inventory = [
  `Generated at: ${new Date().toISOString()}`,
  "Source: prisma/schema.prisma",
  `Model count: ${models.length}`,
  "",
  ...models.map((model) => `- ${model}`),
  "",
].join("\n");
const inventoryPath = resolve(process.cwd(), "docs/review/evidence/model-inventory.txt");
writeFileSync(inventoryPath, inventory);
const writtenModels =
  readFileSync(inventoryPath, "utf8").match(/^- \w+$/gm)?.map((line) => line.slice(2)) ?? [];
const inventoryMatchesSchema = JSON.stringify(writtenModels) === JSON.stringify(models);
console.log(`schemaModels: ${models.length}`);
console.log("modelInventory: docs/review/evidence/model-inventory.txt");
console.log(`inventoryMatchesSchema: ${inventoryMatchesSchema ? "yes" : "no"}`);
console.log(`requiredRlsModels: ${requiredModels.join(", ")}`);
console.log(`missingRequiredModels: ${missing.join(", ") || "none"}`);
console.log(`checkRlsRequiredList: ${requiredModels.every((model) => rls.includes(`"${model}"`)) ? "complete" : "incomplete"}`);
console.log(`rlsUsesLiveDatabase: ${rls.includes("queryRawUnsafe") ? "yes" : "no"}`);
if (missing.length) throw new Error(`Missing schema models: ${missing.join(", ")}`);
if (!inventoryMatchesSchema) throw new Error("Generated model inventory does not match the Prisma schema.");
