import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

interface CheckResult {
  command: string;
  exitCode: number;
  durationMs: number;
  firstLine: string;
  lastLine: string;
  summaryLines: string[];
}

interface RecordedDatabaseAttempt {
  command: string;
  exitCode: number;
  durationMs?: number | null;
  firstOutput?: string;
  lastOutput?: string;
}

interface RecordedSnapshotVerification {
  command: string;
  exitCode: number;
  durationMs: number;
  snapshotOpportunitiesUnchanged?: number;
  rowDigestSha256?: string;
  failure?: string;
}

const root = process.cwd();
const reportPath = resolve(root, "docs/review/implementation/validation-log.md");
const databaseResultPath = resolve(root, "docs/audits/migration-rehearsal-results.json");
const typeScriptStatePath = resolve(root, "tsconfig.tsbuildinfo");
const commands = [
  "npm run prisma:validate",
  "npm run typecheck",
  "npm run lint",
  "npm test -- --reporter=dot --maxWorkers=1 tests/unit/db-guard.test.ts",
  "npm test -- --reporter=verbose --maxWorkers=1 tests/unit/auth-proxy.test.ts tests/unit/auth-recovery.test.ts",
  "npm test -- --reporter=dot --maxWorkers=1",
  "npm run build",
  "npm run impl:self-audit",
];

function sanitize(text: string): string {
  return text
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, "[database URL redacted]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [credential redacted]")
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|sk-ant-[A-Za-z0-9_-]{20,})\b/g, "[credential redacted]")
    .replace(/([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\s*[=:]\s*)[^\s]+/gi, "$1[redacted]")
    .replace(/((?:DATABASE_URL|DIRECT_URL)\s*[=:]\s*)[^\s]+/gi, "$1[redacted]");
}

function run(command: string): CheckResult {
  const environment = { ...process.env };
  for (const name of [
    "DATABASE_URL",
    "DIRECT_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "AUDIT_DB_URL",
    "DEV_DATABASE_URL",
    "DEV_DIRECT_URL",
    "LOCAL_DATABASE_URL",
    "LOCAL_DIRECT_URL",
  ]) delete environment[name];
  environment.DATABASE_URL = "postgresql://localhost:5432/oppscout_check_only";
  environment.DIRECT_URL = "postgresql://localhost:5432/oppscout_check_only";
  environment.OPPSCOUT_DATA_MODE = "memory";
  const started = performance.now();
  const result = spawnSync(command, {
    cwd: root,
    env: environment,
    encoding: "utf8",
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 300_000,
  });
  const output = sanitize(`${result.stdout ?? ""}\n${result.stderr ?? ""}`)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    command,
    exitCode: result.status ?? 1,
    durationMs: Math.round(performance.now() - started),
    firstLine: output[0] ?? result.error?.message ?? "(no output)",
    lastLine: output.at(-1) ?? result.error?.message ?? "(no output)",
    summaryLines: output.filter((line) =>
      /Test Files\s|Tests\s+\d|error TS\d+:|schema at .* is valid|Compiled successfully|Build error occurred|Self-audit (?:passed|failed)|Failed Tests|Invalid Chai property|AssertionError: expected|FAIL\s+tests\//i.test(line),
    ).slice(0, 8),
  };
}

function databaseCheckRow(): { row: string; exitCode: number } | null {
  if (!existsSync(databaseResultPath)) return null;
  const record = JSON.parse(readFileSync(databaseResultPath, "utf8")) as {
    localStackAttempts?: RecordedDatabaseAttempt[];
    snapshotVerificationResult?: RecordedSnapshotVerification;
    command?: string;
    startedAt?: string;
    durationMs?: number;
    duration?: number;
    exitCode?: number | null;
    status?: string;
    firstOutput?: string;
    lastOutput?: string;
    prismaMigrationCount?: number;
    supabaseMirrorMigrations?: string[];
    snapshotOpportunitiesUnchanged?: number | null;
    failure?: string;
    blockingCause?: string;
  };
  const exitCode = record.exitCode ?? null;
  const exitLabel = exitCode === null ? (record.status ?? "UNVERIFIABLE") : String(exitCode);
  const summary = record.failure || record.blockingCause
    ? sanitize(record.failure ?? record.blockingCause ?? "")
    : `Prisma migrations: ${record.prismaMigrationCount ?? "unrecorded"}; Supabase mirrors: ${record.supabaseMirrorMigrations?.length ?? "unrecorded"}; snapshot rows unchanged: ${record.snapshotOpportunitiesUnchanged ?? "not seeded"}; run started ${record.startedAt ?? "time unavailable"}.`;
  const duration = record.durationMs ?? record.duration;
  const row = `| \`${record.command ?? "npm run impl:migration-rehearsal -- --apply"}\` | ${exitLabel} | ${duration === undefined ? "n/a" : `${duration} ms`} | \`${sanitize(record.firstOutput ?? "(not run)").replaceAll("|", "\\|")}\` | \`${sanitize(record.lastOutput ?? "(not run)").replaceAll("|", "\\|")}\` | \`${summary.replaceAll("|", "\\|")}\` |`;
  const setupRows = (record.localStackAttempts ?? []).map((attempt) => {
    const attemptDuration = attempt.durationMs == null ? "not captured" : `${attempt.durationMs} ms`;
    const firstOutput = sanitize(attempt.firstOutput ?? "(no output)").replaceAll("|", "\\|");
    const lastOutput = sanitize(attempt.lastOutput ?? "(no output)").replaceAll("|", "\\|");
    return `| \`${attempt.command}\` | ${attempt.exitCode} | ${attemptDuration} | \`${firstOutput}\` | \`${lastOutput}\` | captured local stack/preflight attempt; no production database used |`;
  });
  const snapshot = record.snapshotVerificationResult;
  const snapshotRow = snapshot
    ? `| \`${snapshot.command}\` | ${snapshot.exitCode} | ${snapshot.durationMs} ms | \`${snapshot.failure ? sanitize(snapshot.failure) : `Verified ${snapshot.snapshotOpportunitiesUnchanged ?? 0} snapshot opportunities.`}\` | \`${snapshot.rowDigestSha256 ?? snapshot.failure ?? "(no output)"}\` | read-only local snapshot comparison; does not make a failed migration rehearsal pass |`
    : null;
  return { row: [...setupRows, row, ...(snapshotRow ? [snapshotRow] : [])].join("\n"), exitCode };
}

function main(): void {
  const previousTypeScriptState = existsSync(typeScriptStatePath)
    ? readFileSync(typeScriptStatePath)
    : undefined;
  const results = commands.map(run);
  if (previousTypeScriptState) writeFileSync(typeScriptStatePath, previousTypeScriptState);
  else if (existsSync(typeScriptStatePath)) unlinkSync(typeScriptStatePath);
  mkdirSync(join(root, "docs/review/implementation"), { recursive: true });
  const rows = results.map((result) =>
    `| \`${result.command}\` | ${result.exitCode} | ${result.durationMs} ms | \`${result.firstLine.replaceAll("|", "\\|")}\` | \`${result.lastLine.replaceAll("|", "\\|")}\` | ${result.summaryLines.map((line) => `\`${line.replaceAll("|", "\\|")}\``).join("<br>") || "(no summary line)"} |`,
  );
  const databaseResult = databaseCheckRow();
  if (databaseResult) rows.push(databaseResult.row);
  const report = [
    "# Generated validation log",
    "",
    "Generated by `scripts/review/impl/run-checks.ts`. Offline check outputs are reduced to sanitized first and last lines; the database row, when present, is the latest recorded local rehearsal artifact and this runner does not connect to a database.",
    "",
    "| Command | Exit | Duration | First output | Last output | Summary lines |",
    "|---|---:|---:|---|---|---|",
    ...rows,
    "",
  ].join("\n");
  writeFileSync(reportPath, report, "utf8");
  for (const result of results) {
    console.log(`${result.command}: exit ${result.exitCode} (${result.durationMs} ms)`);
  }
  if (results.some((result) => result.exitCode !== 0)
    || (databaseResult?.exitCode !== null && databaseResult?.exitCode !== undefined && databaseResult.exitCode !== 0)) {
    process.exitCode = 1;
  }
}

main();
