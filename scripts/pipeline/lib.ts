import { loadEnvConfig } from "@next/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { Opportunity } from "../../src/core/entities/domain";
import { parseDatabaseDate } from "../../src/lib/database-date";
import type { ExistingRecord } from "../../src/services/seeding/pipeline";

loadEnvConfig(process.cwd());

export function parseArgs(argv: string[]): { positional: string[]; flags: Map<string, string | true> } {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (!arg.startsWith("--")) { positional.push(arg); continue; }
    const [name, inline] = arg.slice(2).split("=", 2) as [string, string | undefined];
    if (inline !== undefined) flags.set(name, inline);
    else if (argv[i + 1] && !argv[i + 1]!.startsWith("--")) { flags.set(name, argv[i + 1]!); i += 1; }
    else flags.set(name, true);
  }
  return { positional, flags };
}

export function numberFlag(flags: Map<string, string | true>, name: string, fallback: number): number {
  const value = flags.get(name);
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`--${name} must be a number.`);
  return parsed;
}

export function parseNow(flags: Map<string, string | true>): Date {
  const value = flags.get("now");
  if (typeof value !== "string") return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("--now must be an ISO date-time.");
  return parsed;
}

export function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type Row = Record<string, unknown>;

export async function fetchAll(client: SupabaseClient, table: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from(table).select("*").order("id").range(offset, offset + 499);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    rows.push(...(data as Row[]));
    if (data.length < 500) break;
  }
  return rows;
}

export function rowToOpportunity(row: Row): Opportunity {
  return {
    ...row,
    origin: row.origin === "organization" ? "organization" : "catalog",
    deadline: parseDatabaseDate(row.deadline),
    deadlineType: row.deadlineType === "rolling" ? "rolling" : "fixed",
    publicationDate: parseDatabaseDate(row.publicationDate) ?? new Date(0),
    checkedAt: parseDatabaseDate(row.checkedAt) ?? new Date(0),
    reviewedAt: parseDatabaseDate(row.reviewedAt),
    eligibility: row.eligibility ?? {},
    reviewChecklist: row.reviewChecklist ?? {},
  } as Opportunity;
}

export async function loadCatalogue(client: SupabaseClient): Promise<{ opportunities: Opportunity[]; existing: ExistingRecord[]; orgNames: Map<string, string>; orgIdsByName: Map<string, string> }> {
  const [oppRows, orgRows] = await Promise.all([fetchAll(client, "Opportunity"), fetchAll(client, "Organization")]);
  const orgNames = new Map(orgRows.map((org) => [String(org.id), String(org.name)]));
  const orgIdsByName = new Map(orgRows.map((org) => [String(org.name).trim().toLowerCase(), String(org.id)]));
  const opportunities = oppRows.map(rowToOpportunity).map((opportunity) => ({
    ...opportunity,
    organizationName: opportunity.organizationName ?? (opportunity.organizationId ? orgNames.get(opportunity.organizationId) ?? null : null),
  }));
  const existing: ExistingRecord[] = opportunities.map((opportunity) => ({
    id: opportunity.id, title: opportunity.title, organizationId: opportunity.organizationId, organizationName: opportunity.organizationName ?? null,
    sourceUrl: opportunity.sourceUrl, deadline: opportunity.deadline, status: opportunity.status, verificationStatus: opportunity.verificationStatus,
  }));
  return { opportunities, existing, orgNames, orgIdsByName };
}

/** True when the optional DeadlineType migration has been applied to the database. */
export async function hasDeadlineTypeColumn(client: SupabaseClient): Promise<boolean> {
  const { error } = await client.from("Opportunity").select("deadlineType").limit(1);
  return !error;
}

/** Reads one candidate file (an array, or {"candidates": [...]}) or every .json file in a folder. */
export function readCandidates(path: string): unknown[] {
  if (!existsSync(path)) throw new Error(`Input not found: ${path}`);
  const files = statSync(path).isDirectory() ? readdirSync(path).filter((name) => name.endsWith(".json")).sort().map((name) => join(path, name)) : [path];
  const records: unknown[] = [];
  for (const file of files) {
    const parsed = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, "")) as unknown;
    const list = Array.isArray(parsed) ? parsed : (parsed as { candidates?: unknown[] }).candidates;
    if (!Array.isArray(list)) throw new Error(`${file} must be a JSON array or an object with a "candidates" array.`);
    records.push(...list);
  }
  return records;
}

export function runIdFor(now: Date): string {
  return `run-${now.toISOString().replace(/[-:]/g, "").slice(0, 13)}`;
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function journal(path: string, entry: unknown): void {
  appendFileSync(path, `${JSON.stringify(entry)}\n`);
}

export function bar(char = "-"): string {
  return char.repeat(72);
}
