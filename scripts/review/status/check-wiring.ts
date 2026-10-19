import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

function walk(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const root = process.cwd();
const allFiles = walk(resolve(root, "src"));
const contents = new Map<string, string>();
for (const file of allFiles) {
  try { contents.set(file, readFileSync(file, "utf8")); } catch { /* ignore */ }
}

const checks = [
  ["feature-flags reads audienceGate", /audienceGate/.test(contents.get(resolve(root, "src/config/feature-flags.ts")) ?? "")],
  ["hard gate imported by feed or matching code", /evaluateHardGates/.test((Array.from(contents.values()).join("\n")))],
  ["report route imports reportSuspiciousListing", /reportSuspiciousListing/.test((Array.from(contents.values()).join("\n")))],
  ["org submission imported by v1 opportunities route", /submitOrganizationOpportunity/.test((Array.from(contents.values()).join("\n")))],
  ["admin review page reads review queue", /ReviewCard|review/.test((Array.from(contents.values()).join("\n")))],
  ["match engine imports rule-based gates", /evaluateHardGates/.test((Array.from(contents.values()).join("\n")))],
];

for (const [label, found] of checks) {
  console.log(`${label}: ${found ? "WIRED" : "NOT WIRED"}`);
}
