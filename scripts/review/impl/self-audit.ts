import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const errors: string[] = [];
const selfPath = "scripts/review/impl/self-audit.ts";
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".ps1", ".sql"]);

function gitLines(...args: string[]): string[] {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const changed = new Set([
  ...gitLines("diff", "--name-only", "HEAD"),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
]);
const sourceChanges = [...changed].filter((path) => sourceExtensions.has(resolve(path).split(".").pop() ? `.${resolve(path).split(".").pop()}` : ""));
const sourceMarkers = [
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bHACK\b/i,
  /\bplaceholder\b/i,
  /\bstub\b/i,
  /\blorem\b/i,
];
for (const relative of sourceChanges.filter((path) => !path.startsWith("tests\\") && !path.startsWith("tests/") && path !== selfPath)) {
  if (!existsSync(resolve(root, relative))) continue;
  const content = readFileSync(resolve(root, relative), "utf8");
  if (sourceMarkers.some((marker) => marker.test(content)) || /not implemented/i.test(content)) {
    errors.push(`${relative}: prohibited unfinished-work marker found.`);
  }
}

const testFiles = walk(resolve(root, "tests")).filter((path) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path));
const skippedTest = /\.(?:skip|todo)\s*\(|\b(?:xit|xdescribe|it\.only|describe\.only)\s*\(/;
for (const path of testFiles) {
  if (skippedTest.test(readFileSync(path, "utf8"))) {
    errors.push(`${path.slice(root.length + 1)}: skipped or focused test marker found.`);
  }
}

const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};
const scripts = packageJson.scripts ?? {};
for (const path of [
  "scripts/migration-rehearsal.ts",
  "scripts/review/impl/seed-snapshot.ts",
]) {
  const isRegistered = Object.values(scripts).some((command) => command.includes(path));
  const content = existsSync(resolve(root, path)) ? readFileSync(resolve(root, path), "utf8") : "";
  if (!isRegistered || !content.includes("assertSafeDatabaseTarget")) {
    errors.push(`${path}: guarded database script is missing its package entry or safety check.`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Self-audit passed: ${sourceChanges.length} changed source files checked; ${testFiles.length} test files checked for skipped/focused tests.`);
}
