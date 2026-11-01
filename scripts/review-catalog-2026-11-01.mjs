// One-day, evidence-led catalogue review. Dry run by default; never reuse approvals on another day.
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

const directory = 'docs/audits/2026-11-01';
const { loadEnvConfig } = nextEnv;
const before = JSON.parse(readFileSync(`${directory}/catalog-before.json`, 'utf8'));
const now = new Date();
const timestamp = now.toISOString();
const reviewDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(now);
if (reviewDate !== '2026-11-01') throw new Error('Refresh the source review before running on another day.');
const manifest = JSON.parse(readFileSync(`${directory}/source-reviews.json`, 'utf8'));
const checklist = { sourceAuthentic: true, noInappropriateFees: true, noSensitiveDataAsk: true, deadlinePlausible: true, duplicateChecked: true };
const changes = new Map();
function rowFor(prefix) {
  const matches = before.filter(row => row.id.startsWith(prefix));
  if (matches.length !== 1) throw new Error(`Ambiguous identifier: ${prefix}`);
  const row = matches[0];
  if (row.verificationStatus !== 'pending' || row.origin !== 'catalog') throw new Error(`Not a pending catalog row: ${row.id}`);
  return row;
}
function record(row, decision, fields, reason) {
  changes.set(row.id, { id: row.id, title: row.title, decision, previous: row, update: {
    ...fields,
    reviewedAt: timestamp,
    reviewerId: 'catalog-source-review:2026-11-01',
    reviewNotes: `${row.reviewNotes ?? ''}\n2026-11-01 review: ${reason}`.trim(),
  } });
}

// This is expiry triage against stored deadlines, not a claim of renewed provider verification.
for (const row of before) {
  if (row.verificationStatus === 'pending' && row.origin === 'catalog' && row.status !== 'closed' && row.deadline && new Date(`${row.deadline}Z`.replace(/ZZ$/, 'Z')) <= now) {
    record(row, 'close-expired', { status: 'closed' }, 'Stored deadline has elapsed. Closed for catalogue hygiene; source availability was not independently rechecked. Verification remains pending.');
  }
}
for (const review of manifest.holds) {
  const row = rowFor(review.id);
  const close = review.close === true || changes.get(row.id)?.decision === 'close-expired';
  record(row, close ? 'close-unavailable' : 'hold', close ? { status: 'closed' } : {}, `${review.reason} Evidence: ${review.sources.join(' ')}. Not approved.`);
}
for (const review of manifest.approvals) {
  const row = rowFor(review.id);
  if (new Date(review.fields.deadline) <= now) throw new Error(`Approval deadline elapsed: ${row.id}`);
  for (const prefix of review.duplicates ?? []) {
    const duplicate = rowFor(prefix);
    record(duplicate, 'close-duplicate', { status: 'closed' }, `Same programme and cycle as canonical listing ${row.id}. Preserve this record and its relationships; exclude duplicate from browse. Evidence: ${review.sources.join(' ')}`);
  }
  record(row, 'approve', { ...review.fields, status: 'open', verificationStatus: 'verified', reviewChecklist: checklist, checkedAt: timestamp, requiredSkills: [], preferredSkills: [] },
    `Official programme, eligibility and application instructions reviewed. ${review.evidence} No inappropriate fee or off-platform sensitive-data request identified in the reviewed instructions; this does not mean every programme is free. Application documents belong only with the provider. ${review.sources.join(' ')}. Catalogue screened for duplicate programme/cycle; duplicates are closed first. Original publication date remains unverified. Profile matching cannot verify every additional requirement.`);
}

const plan = [...changes.values()].sort((a, b) => Number(a.decision === 'approve') - Number(b.decision === 'approve'));
const triage = before.filter(row => row.verificationStatus === 'pending').map(row => ({
  id: row.id, title: row.title, decision: changes.get(row.id)?.decision ?? (row.status === 'closed' ? 'already-closed' : 'not-source-reviewed'),
  reason: changes.get(row.id)?.update.reviewNotes.split('\n').at(-1) ?? 'Not approved in this pass; existing verification and visibility rules retained.',
}));
const counts = list => list.reduce((result, entry) => { result[entry.decision] = (result[entry.decision] ?? 0) + 1; return result; }, {});
writeFileSync(`${directory}/review-plan.json`, JSON.stringify(plan, null, 2));
writeFileSync(`${directory}/pending-triage.json`, JSON.stringify(triage, null, 2));
console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run', pending: triage.length, decisions: counts(triage), approvals: plan.filter(c => c.decision === 'approve').map(c => ({ id: c.id, title: c.title })) }, null, 2));
if (process.argv.includes('--apply')) {
  if (existsSync(`${directory}/applied.jsonl`)) throw new Error('An apply journal already exists. Inspect it before any retry.');
  loadEnvConfig(process.cwd());
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const readAll = async () => {
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await client.from('Opportunity').select('*').order('id').range(offset, offset + 499);
      if (error) throw new Error(error.message);
      rows.push(...data);
      if (data.length < 500) return rows;
    }
  };
  const current = await readAll();
  if (!isDeepStrictEqual(current, before)) throw new Error('Catalogue changed since snapshot; refresh duplicate review and plan.');
  for (const change of plan) {
    let query = client.from('Opportunity').update(change.update).eq('id', change.id);
    // Compare every field we may overwrite, plus original identity and state, on the database request.
    const keys = new Set([...Object.keys(change.update), 'origin', 'sourceUrl', 'title', 'status', 'verificationStatus', 'checkedAt', 'reviewedAt']);
    for (const key of keys) {
      const value = change.previous[key];
      const encoded = Array.isArray(value) ? `{${value.map(item => JSON.stringify(item)).join(',')}}` : typeof value === 'object' ? JSON.stringify(value) : value;
      query = value === null ? query.is(key, null) : query.eq(key, encoded);
    }
    const { data, error } = await query.select('*');
    if (error || data?.length !== 1) throw new Error(`Write stopped for ${change.id}: ${error?.message ?? 'concurrent edit'}. Inspect applied.jsonl.`);
    appendFileSync(`${directory}/applied.jsonl`, JSON.stringify({ id: change.id, decision: change.decision, appliedAt: new Date().toISOString() }) + '\n');
  }
  const after = await readAll();
  writeFileSync(`${directory}/catalog-after.json`, JSON.stringify(after, null, 2));
  for (const change of plan) {
    const row = after.find(item => item.id === change.id);
    for (const [key, expected] of Object.entries(change.update)) {
      const actual = row?.[key];
      const matches = ['deadline', 'checkedAt', 'reviewedAt'].includes(key)
        ? new Date(actual.endsWith('Z') ? actual : `${actual}Z`).getTime() === new Date(expected).getTime()
        : isDeepStrictEqual(actual, expected);
      if (!matches) throw new Error(`Read-back mismatch: ${change.id}.${key}`);
    }
  }
  const visibleVerified = after.filter(row => row.verificationStatus === 'verified' && ['open', 'closing_soon'].includes(row.status) && (!row.deadline || new Date(`${row.deadline}Z`.replace(/ZZ$/, 'Z')) > now));
  const result = { applied: plan.length, decisions: counts(plan), activeVerified: visibleVerified.length, verifiedReadBack: true, checkedAt: new Date().toISOString() };
  writeFileSync(`${directory}/result.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
