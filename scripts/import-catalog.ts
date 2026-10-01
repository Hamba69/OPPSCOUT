import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { getSeedOpportunities, getSeedOrganizations, DEMO_ORG_ID, AFRICAN_UNION_ORG_ID } from '../src/data/seed-catalog';
import type { Opportunity } from '../src/core/entities/domain';

// Uses the same REST transport/environment as the app. No demo users or fixtures.
// Dry-run by default; inserts missing records only, preserving existing review decisions.
loadEnvConfig(process.cwd());
const now = new Date();
const reviewedAt = new Date('2026-10-02T00:00:00+03:00');
const liveReviewedIds = new Set(['55555555-5555-4555-8555-555555555552', '55555555-5555-4555-8555-555555555553']);
const au: Opportunity = {
  id: '55555555-5555-4555-8555-555555555563',
  organizationId: AFRICAN_UNION_ORG_ID,
  title: 'African Union Internship Program 2026', category: 'internship',
  description: 'A full-time internship in Addis Ababa providing administrative and technical experience across African Union departments. Three months, renewable once. Applicants must be nationals of an AU member state, be in the final year of a degree or hold a relevant degree, speak an AU working language, and be no older than 32 at selection. The internship is unpaid: interns cover travel, accommodation, living expenses and individual insurance. Nationality and conduct requirements must be confirmed on the official application; OppScout does not currently collect nationality.',
  eligibility: { educationLevels: ['bachelors', 'masters', 'phd'], maximumAge: 32, programmeRules: [
    { field: 'graduationStatus', allowedValues: ['final year', 'graduated', 'graduate', 'graduated within 12 months', 'masters student', 'phd student'], label: 'Final-year student or degree holder' },
    { field: 'language', allowedValues: ['Arabic', 'English', 'French', 'Portuguese'], label: 'AU working language' },
  ] },
  requiredSkills: ['communication', 'computer literacy', 'teamwork'], preferredSkills: ['excel', 'report writing'],
  location: 'Addis Ababa, Ethiopia', workMode: 'onsite',
  // Official source specifies the date only. Use start of closing day in Ethiopia conservatively.
  deadline: new Date('2026-12-31T00:00:00+03:00'),
  applicationMethod: 'Apply through the official AU vacancy using the mandatory AU CV template. Confirm AU-member-state nationality and conduct requirements. Supply a motivation letter, academic certificates, CV, valid passport or national ID, and recommendation letter only through the official application portal. Interns fund travel, living costs and insurance.',
  sourceUrl: 'https://jobs.au.int/job/Internship-Program/1506-en_US/',
  verificationStatus: 'verified', source: 'scraped', publicationDate: new Date('2026-02-16T00:00:00+03:00'),
  checkedAt: reviewedAt, status: 'open',
  reviewChecklist: { sourceAuthentic: true, noInappropriateFees: true, noSensitiveDataAsk: true, deadlinePlausible: true, duplicateChecked: true },
  reviewNotes: 'Official AU vacancy 1506 and au.int/en/internships reviewed 2 October 2026. Source confirms closing date, degree-holder eligibility, age cap, working languages and unpaid terms. Identity documents are requested only via the official recruitment portal. Nationality is an additional application requirement not captured by the current profile schema. Closing time is not published; stored at start of closing day EAT. Duplicate screening against the connected database and catalog completed before insertion.',
  reviewerId: 'catalog-source-review:2026-10-02', reviewedAt,
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server-side Supabase configuration is missing.');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [existingOrgs, existingOpps] = await Promise.all([
    client.from('Organization').select('id,name'), client.from('Opportunity').select('id,title,sourceUrl,organizationId'),
  ]);
  if (existingOrgs.error || existingOpps.error) throw new Error(existingOrgs.error?.message ?? existingOpps.error?.message);
  const orgs = getSeedOrganizations().filter(o => o.id !== DEMO_ORG_ID && !existingOrgs.data.some(e => e.id === o.id || e.name.trim().toLowerCase() === o.name.trim().toLowerCase()));
  const all = [...getSeedOpportunities().filter(o => o.organizationId !== DEMO_ORG_ID), au];
  const seen = new Set<string>();
  const opps = all.filter(o => {
    const signature = `${o.organizationId}/${o.title.trim().toLowerCase()}`;
    if (seen.has(signature)) throw new Error(`Duplicate catalog title: ${o.title}`);
    seen.add(signature);
    return !existingOpps.data.some(e => e.id === o.id || e.sourceUrl === o.sourceUrl || (e.organizationId === o.organizationId && e.title.trim().toLowerCase() === o.title.trim().toLowerCase()));
  }).map(o => {
    const row = { ...o };
    delete row.organization;
    const expired = row.deadline !== null && row.deadline <= now;
    if (expired) row.status = 'closed';
    if (liveReviewedIds.has(row.id)) {
      row.checkedAt = reviewedAt; row.reviewedAt = reviewedAt; row.reviewerId = 'catalog-source-review:2026-10-02';
      row.reviewNotes = 'Official UNESCO vacancy rechecked 2 October 2026. Internship talent pool, not guaranteed placement; unpaid. Requires current study or graduation within 12 months, age at least 20, and English or French proficiency. Official source states 31 December 2026 midnight; no timezone published, stored conservatively at start of closing day UTC. Identity and diploma documents only through official recruitment.';
      row.deadline = new Date('2026-12-31T00:00:00Z');
      row.description += ' This is an unpaid talent pool; placement is not guaranteed. Interns finance travel and arrange visas and insurance.';
    } else if (row.verificationStatus === 'verified' && row.id !== au.id && !expired) {
      row.verificationStatus = 'pending'; row.reviewChecklist = {}; row.reviewerId = null; row.reviewedAt = null;
      row.reviewNotes = 'Historical catalog entry requires a current official-source review before public matching.';
    }
    return row;
  });
  const counts = opps.reduce<Record<string, number>>((out, o) => { const k = `${o.verificationStatus}/${o.status}`; out[k] = (out[k] ?? 0) + 1; return out; }, {});
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run', target: new URL(url).hostname, organizationsToInsert: orgs.length, opportunitiesToInsert: opps.length, counts }, null, 2));
  if (!process.argv.includes('--apply')) return;
  if (orgs.length) { const r = await client.from('Organization').insert(orgs); if (r.error) throw new Error(`Organization import: ${r.error.message}`); }
  if (opps.length) { const r = await client.from('Opportunity').insert(opps); if (r.error) throw new Error(`Opportunity import: ${r.error.message}`); }
  const r = await client.from('Opportunity').select('id', { count: 'exact', head: true });
  if (r.error) throw new Error(r.error.message);
  console.log(`Import verified: ${r.count} database opportunities. Existing profiles and review decisions preserved.`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Catalog import failed'); process.exitCode = 1; });
