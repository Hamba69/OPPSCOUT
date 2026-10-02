import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
import type { Eligibility } from '../src/core/entities/domain';
import { titleSimilarity } from '../src/services/ingestion/deduplication';

// Explicit source reviews made on 2026-10-02. Never reuse as a future verification.
const reviews: Array<{ suffix: number; sourceUrl: string; evidence: string[]; description: string; deadline: string | null; eligibility: Eligibility; applicationMethod: string; location: string; workMode: 'onsite' }> = [
  { suffix: 1, sourceUrl: 'https://www.chevening.org/scholarship/uganda/', evidence: ['https://www.chevening.org/resource-hub/guidance/eligibility/'], deadline: '2026-10-06T11:00:00Z', location: 'United Kingdom', workMode: 'onsite',
    description: 'Chevening offers postgraduate scholarships for Uganda applicants to study in the UK in 2027/28. Applications close on 6 October 2026 at 11:00 UTC. Review citizenship, residence, prior funding and employment exclusions before applying.',
    eligibility: { educationLevels: ['bachelors', 'masters', 'phd'], additionalRequirements: ['Confirm eligible citizenship and residence, and return home for at least two years after the scholarship.', 'Undergraduate studies must have finished at least two years before the deadline; 2,800 hours of post-graduation work experience are required.', 'Apply to three eligible UK courses and meet the unconditional-offer deadline. Check British citizenship, employment/relative and previous UK-government-scholarship exclusions.'] },
    applicationMethod: 'Use the application portal linked from the official Uganda scholarship page. Review the full eligibility guidance and prepare the required course choices and documents.' },
  ...([2, 3] as const).map(suffix => ({ suffix, sourceUrl: suffix === 2 ? 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-phd-scholarships-for-least-developed-countries-and-vulnerable-states/' : 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/', evidence: [] as string[], deadline: '2026-10-20T15:00:00Z', location: 'United Kingdom', workMode: 'onsite' as const,
    description: `Commonwealth ${suffix === 2 ? 'PhD' : "Master's"} scholarships support full-time UK study beginning in September/October 2027. Uganda is eligible. The CSC deadline is 20 October 2026, 16:00 BST; nominating agencies can impose earlier deadlines. Applying is free.`,
    eligibility: { additionalRequirements: ['Confirm eligible citizenship/refugee status and permanent residence, financial need, availability for September 2027 and commitment to return home.', 'Meet the published degree standard by September 2027 (normally 2:1, or lower second plus relevant postgraduate qualification); contextual disability nomination may apply.', suffix === 2 ? 'Check the restriction on existing PhD/MPhil registration and obtain a proposed UK supervisor statement.' : 'Check exclusions for prior UK Master’s study or Commonwealth Master’s awards; a second Master’s requires justification.'] },
    applicationMethod: 'Apply through CSC Central AND an approved nominator. Check the nominator deadline. Upload the required transcripts, references and eligibility documents only to the official portal.' })),
  { suffix: 80, sourceUrl: 'https://www.drkfoundation.org/apply/', evidence: ['https://www.drkfoundation.org/apply/faq/'], deadline: null, location: 'Eligible project locations', workMode: 'onsite',
    description: 'DRK accepts year-round funding applications from early-stage social impact organizations. This is support for an organization and its scalable solution, not a personal scholarship or salaried job.',
    eligibility: { additionalRequirements: ['Apply on behalf of a social impact organization with a scalable approach and evidence of results. Confirm current funding geography and organizational fit with DRK.', 'Observe the reapplication restrictions: normally only if encouraged, no sooner than one year after decline and at most twice.'] },
    applicationMethod: 'Submit the online form linked from DRK with an executive summary, pitch deck or business plan and leadership CVs. Do not email the application.' },
  { suffix: 81, sourceUrl: 'https://apply.ruffordsmallgrants.org/', evidence: ['https://apply.ruffordsmallgrants.org/help/faqs', 'https://apply.ruffordsmallgrants.org/help/criteria'], deadline: null, location: 'Eligible conservation project countries', workMode: 'onsite',
    description: 'Rufford accepts conservation project proposals throughout the year. First-stage grants can be up to GBP 7,000. The programme supports early-career conservation work; it does not pay academic fees or fund undergraduate students.',
    eligibility: { additionalRequirements: ['Confirm project-country eligibility and early-career criteria. Undergraduate students are not eligible.', 'Project must not already have started. Arrange an organization to receive funds and three independent references. Apply in English at most once per 12 months.'] },
    applicationMethod: 'Create an account on the official Rufford application portal, read the country and project criteria, and submit the proposal with references.' },
  { suffix: 83, sourceUrl: 'https://www.uaf-africa.org/apply-for-a-grant/', evidence: [], deadline: null, location: 'Africa', workMode: 'onsite',
    description: 'Urgent Action Fund Africa supports urgent strategic interventions advancing women’s human rights. Its Rapid Response form covers action within three months. The official application page publishes no fixed closing date.',
    eligibility: { additionalRequirements: ['The intervention must be strategic, unanticipated, urgent, sustainable and supported by others familiar with the situation.', 'Use the Rapid Response form for action within three months; confirm group and geographic eligibility with the fund.'] },
    applicationMethod: 'Use the Rapid Response application form linked from the official UAF Africa page. Protection and longer-term advocacy have separate forms.' },
  { suffix: 84, sourceUrl: 'https://fundinnovation.dev/en/launch-project', evidence: ['https://fundinnovation.wiin.io/en/applications/application'], deadline: null, location: 'Eligible low- and middle-income countries', workMode: 'onsite',
    description: 'FID has a continuously open call for innovations addressing poverty and inequality. Funding stages support testing, evaluation and scaling. The current call excludes projects in Burkina Faso, Mali and Niger.',
    eligibility: { additionalRequirements: ['Organizations and collectives may apply; individual applicants and international organizations are ineligible.', 'Project must be in an eligible low- or middle-income country, excluding Burkina Faso, Mali and Niger. Select the funding stage appropriate to the evidence available.'] },
    applicationMethod: 'Read the current call guide and submit through the FID portal linked from the official page, including its application and budget templates.' },
  { suffix: 85, sourceUrl: 'https://wphfund.org/rrw-short-term-grants/', evidence: ['https://wphfund.org/frequently-asked-questions-faq/'], deadline: null, location: 'Eligible countries with a qualifying peace process', workMode: 'onsite',
    description: 'WPHF Rapid Response Window short-term grants support urgent initiatives by local women’s rights organizations influencing peace processes or peace agreements. Applications are accepted year-round; grants can reach USD 100,000 for up to six months.',
    eligibility: { additionalRequirements: ['Lead applicant must be an eligible, legally registered local women’s rights organization.', 'Confirm an ODA-eligible country and a qualifying track 1/2 peace process or peace-agreement implementation. A country name alone does not establish eligibility.'] },
    applicationMethod: 'Download the Short-Term Grants concept-note template from the official page and submit as directed to WPHF-RRW@unwomen.org.' },
  { suffix: 88, sourceUrl: 'https://thepollinationproject.org/apply/', evidence: ['https://thepollinationproject.org/funding-eligibility/'], deadline: null, location: 'Worldwide community projects', workMode: 'onsite',
    description: 'The Pollination Project offers rolling seed funding of up to USD 500 for volunteer-led community work. Individuals, informal groups and nonprofit organizations worldwide may apply, subject to the fund’s detailed restrictions.',
    eligibility: { additionalRequirements: ['Annual organizational budget must be below USD 50,000 and project cost below USD 10,000; no paid staff or private profit.', 'No prior TPP funding or concurrent application by the group. Show some work already undertaken and capacity to receive USD funds.', 'Review animal-product, environmental, political, religious and other project restrictions on the official page before applying.'] },
    applicationMethod: 'Read the eligibility guide and apply through the form linked on the official website. Funding is competitive and not guaranteed.' },
];

loadEnvConfig(process.cwd());
async function main() {
  const apply = process.argv.includes('--apply');
  if (apply && new Date().toISOString().slice(0, 10) !== '2026-10-02') throw new Error('This dated source review must be refreshed before applying on another day.');
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const snapshot = JSON.parse(readFileSync('docs/audits/catalog-snapshot.json', 'utf8')) as { opportunities: Array<Record<string, unknown>> };
  const changes = reviews.map(review => {
    const id = `77777777-7777-4777-8777-${String(review.suffix).padStart(12, '0')}`;
    const current = snapshot.opportunities.find(row => row.id === id);
    if (!current) throw new Error(`Missing pending listing ${id}`);
    const duplicate = snapshot.opportunities.find(row => row.id !== id && row.organizationId === current.organizationId && titleSimilarity(String(row.title), String(current.title)) >= 0.85 && (row.deadline === null || review.deadline === null || Math.abs(new Date(String(row.deadline)).getTime() - new Date(review.deadline).getTime()) <= 3 * 86400000));
    if (duplicate) throw new Error(`Unresolved duplicate for ${id}`);
    const { suffix: _suffix, evidence, ...fields } = review;
    void _suffix;
    return { id, previous: current, update: { ...fields, requiredSkills: [], preferredSkills: [], verificationStatus: 'verified', status: 'open', checkedAt: new Date().toISOString(), reviewedAt: new Date().toISOString(), reviewerId: 'official-source-review:2026-10-02', reviewChecklist: { sourceAuthentic: true, noInappropriateFees: true, noSensitiveDataAsk: true, deadlinePlausible: true, duplicateChecked: true }, reviewNotes: `Reviewed official programme, eligibility and application sources on 2026-10-02: ${[review.sourceUrl, ...evidence].join(' ')}. No inappropriate application fee or off-platform sensitive-data request identified in reviewed instructions. Required documents belong only in the provider application. Duplicate screened against catalog. ${review.deadline ? 'Closing time confirmed on official page.' : 'No fixed closing date; do not infer perpetual availability.'} Additional requirements are not all verifiable from a seeker profile. Grant work mode denotes project activity, not a remote job. Original archive publication timestamp is not independently confirmed.` } };
  });
  writeFileSync('docs/audits/reviewed-catalog-changes.json', JSON.stringify(changes, null, 2));
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', reviews: changes.map(c => ({ id: c.id, title: c.previous.title, sourceUrl: c.update.sourceUrl })) }, null, 2));
  if (!apply) return;
  for (const change of changes) {
    const { data, error } = await client.from('Opportunity').update(change.update).eq('id', change.id).eq('verificationStatus', 'pending').select('id,verificationStatus,sourceUrl,deadline');
    if (error) throw new Error(error.message);
    if (data.length !== 1) throw new Error(`Concurrent review or already applied: ${change.id}`);
  }
  // Close expired records without changing review decisions or resetting checkedAt.
  const closed = await client.from('Opportunity').update({ status: 'closed' }).in('status', ['open', 'closing_soon', 'stale']).lt('deadline', new Date().toISOString()).select('id');
  if (closed.error) throw new Error(closed.error.message);
  console.log(JSON.stringify({ verified: changes.length, expiredClosed: closed.data.length }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
