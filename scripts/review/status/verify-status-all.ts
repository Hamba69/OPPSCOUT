import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const outDir = resolve(root, "docs/review/implementation-status/evidence");
mkdirSync(outDir, { recursive: true });

const scriptPaths = [
  "scripts/review/status/check-structure.ts",
  "scripts/review/status/check-wiring.ts",
  "scripts/review/status/check-adapters.ts",
  "scripts/review/status/check-behaviour.ts",
  "scripts/review/status/launch-gate.ts",
];

const outputs: string[] = [];
for (const scriptPath of scriptPaths) {
  const full = resolve(root, scriptPath);
  if (!existsSync(full)) {
    outputs.push(`${scriptPath}: MISSING`);
    continue;
  }
  try {
    const text = execSync(`npx tsx "${full}"`, { cwd: root, encoding: "utf8" });
    const target = join(outDir, scriptPath.split("/").pop()!.replace(/\.ts$/, ".txt"));
    writeFileSync(target, text, "utf8");
    outputs.push(`${scriptPath}: OK\n${text}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputs.push(`${scriptPath}: FAILED\n${message}`);
  }
}

const summary = outputs.join("\n\n---\n\n");
writeFileSync(resolve(outDir, "verification-summary.txt"), summary, "utf8");
console.log(summary);
