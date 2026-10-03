import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

type RlsRow = { table_name: string; row_security_enabled: boolean };
type PolicyRow = { table_name: string; policy_name: string };

async function main(): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<RlsRow[]>(`
    SELECT c.relname AS table_name, c.relrowsecurity AS row_security_enabled
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname
  `);

  const policies = await prisma.$queryRawUnsafe<PolicyRow[]>(`
    SELECT schemaname, tablename AS table_name, policyname AS policy_name
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `);

  const required = ["Feedback", "RequestMetric", "WebVitalSample", "MatchRun", "UnmatchedTerm", "AdminAccessLog", "MetricRollup", "StoredDocument", "SeekerAccessLog", "SeekerPipelineEntry"];
  const missing = required.filter(name => !rows.some(row => row.table_name === name));
  if (missing.length) throw new Error(`Missing RLS tables: ${missing.join(", ")}`);

  const disabled = rows.filter((row) => row.row_security_enabled === false).map((row) => row.table_name);

  const storagePolicies = await prisma.$queryRawUnsafe<Array<{ policy_name: string; roles: string[] }>>(`
    SELECT policyname AS policy_name, roles
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  `).catch(() => []);
  const unsafeStoragePolicies = storagePolicies.filter((policy) => policy.roles.some((role) => role === "anon" || role === "authenticated"));
  if (!rows.length || disabled.length || policies.length || unsafeStoragePolicies.length) {
    const problems = [
      !rows.length ? "no public tables found" : "",
      disabled.length ? `RLS disabled: ${[...new Set(disabled)].join(", ")}` : "",
      policies.length ? `policies present: ${policies.map((policy) => `${policy.table_name}.${policy.policy_name}`).join(", ")}` : "",
      unsafeStoragePolicies.length ? `unsafe storage policies: ${unsafeStoragePolicies.map((policy) => policy.policy_name).join(", ")}` : "",
    ].filter(Boolean).join("; ");
    throw new Error(`Public schema RLS check failed (${problems}). Every ordinary table in public must have RLS enabled and no policies.`);
  }

  console.log(`RLS enabled on ${rows.length} public tables and no policies are present.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "RLS check failed.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
