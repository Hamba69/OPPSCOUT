import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';

loadEnvConfig(process.cwd());
async function main() {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from('Opportunity').select('*').order('id').range(offset, offset + 499);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 500) break;
  }
  const now = new Date();
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = `${row.verificationStatus}/${row.status}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const active = rows.filter(r => r.verificationStatus === 'verified' && ['open', 'closing_soon'].includes(String(r.status)) && (!r.deadline || new Date(String(r.deadline)) > now));
  const report = { capturedAt: now.toISOString(), total: rows.length, counts, activeVerified: active.length, activeCategories: [...new Set(active.map(r => r.category))], opportunities: rows };
  mkdirSync('docs/audits', { recursive: true });
  writeFileSync('docs/audits/catalog-snapshot.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, opportunities: rows.map(r => ({ id: r.id, title: r.title, sourceUrl: r.sourceUrl, deadline: r.deadline, verificationStatus: r.verificationStatus, status: r.status })) }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
