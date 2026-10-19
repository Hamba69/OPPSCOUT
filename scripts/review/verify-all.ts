import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const commands = [
  ["snapshot", "verify-snapshot.ts"],
  ["structure", "verify-structure.ts"],
  ["appendix-b", "verify-appendix-b.ts"],
] as const;
let failed = false;
for (const [label, file] of commands) {
  console.log(`\n== ${label} ==`);
  const runner = resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs");
  const result = spawnSync(process.execPath, [runner, `scripts/review/${file}`], { stdio: "inherit" });
  if (result.status !== 0) failed = true;
}
if (failed) process.exitCode = 1;
