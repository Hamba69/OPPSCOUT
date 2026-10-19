import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const repoFiles = [
  "src/lib/repository/prisma.ts",
  "src/lib/repository/supabase.ts",
  "src/lib/repository/memory.ts",
  "src/core/entities/domain.ts",
  "src/lib/repository/types.ts",
];

const checks = [
  ["prisma repo file", existsSync(resolve(root, repoFiles[0]))],
  ["supabase repo file", existsSync(resolve(root, repoFiles[1]))],
  ["memory repo file", existsSync(resolve(root, repoFiles[2]))],
  ["shared domain types file", existsSync(resolve(root, repoFiles[3]))],
  ["shared repository types file", existsSync(resolve(root, repoFiles[4]))],
  ["Lead methods in shared types", /interface\s+Lead|type\s+Lead/.test(readFileSync(resolve(root, "src/core/entities/domain.ts"), "utf8"))],
  ["Source methods in shared types", /interface\s+Source|type\s+Source/.test(readFileSync(resolve(root, "src/core/entities/domain.ts"), "utf8"))],
  ["ListingReport methods in shared types", /interface\s+ListingReport|type\s+ListingReport/.test(readFileSync(resolve(root, "src/core/entities/domain.ts"), "utf8"))],
  ["IngestionRun methods in shared types", /interface\s+IngestionRun|type\s+IngestionRun/.test(readFileSync(resolve(root, "src/core/entities/domain.ts"), "utf8"))],
];
for (const [label, found] of checks) {
  console.log(`${label}: ${found ? "PRESENT" : "MISSING"}`);
}
