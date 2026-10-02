import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { titleSimilarity } from '../src/services/ingestion/deduplication';

loadEnvConfig(process.cwd());
async function main() {
  const apply = process.argv.includes('--apply');
  if (apply && new Date().toISOString().slice(0, 10) !== '2026-10-02') throw new Error('Refresh this dated review before applying.');
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const snapshot = JSON.parse(readFileSync('docs/audits/catalog-snapshot.json', 'utf8')) as { opportunities: Array<{ id: string; organizationId: string; title: string; sourceUrl: string }> };
  const now = new Date().toISOString();
  const base = { category: 'job', source: 'scraped', verificationStatus: 'verified', status: 'open', workMode: 'onsite', checkedAt: now, reviewedAt: now, reviewerId: 'official-source-review:2026-10-02', reviewChecklist: { sourceAuthentic: true, noInappropriateFees: true, noSensitiveDataAsk: true, deadlinePlausible: true, duplicateChecked: true }, preferredSkills: [], applicationMethod: 'Use Apply now on the official vacancy page. Review the full qualification and location requirements; submit documents only through the linked official recruitment portal.' };
  const jobs = [
    { ...base, id: '77777777-7777-4777-8777-000000000028', organizationId: '66666666-6666-4666-8666-000000000066', title: 'Digital Impact Manager, P-4, Kampala', sourceUrl: 'https://careers.pageuppeople.com/671/cw/en-us/job/595857/digital-impact-manager-p4-fixed-term-position-kampala-uganda-00051311', location: 'Kampala, Uganda', deadline: '2026-10-06T20:55:00Z',
      description: 'UNICEF seeks a Digital Impact Manager for its Kampala office, leading digital strategy and ICT across programmes and operations. This senior P-4 post requires an advanced relevant degree and eight years of relevant experience. Applications close 6 October 2026 at 23:55 EAT.',
      eligibility: { educationLevels: ['masters', 'phd'], minimumExperienceMonths: 96, fieldsOfStudy: ['computer science', 'information systems', 'business administration', 'software engineering', 'information technology management'], programmeRules: [{ field: 'language', allowedValues: ['English'], label: 'English fluency' }], additionalRequirements: ['Confirm advanced-degree equivalence, relevant senior experience, mobility and medical/visa requirements in the official recruitment process.'] }, requiredSkills: ['team leadership', 'project management', 'business analytics', 'partnerships', 'information security', 'audit', 'risk management'],
      reviewNotes: 'Official UNICEF PageUp vacancy 595857 reviewed 2026-10-02. Source confirms deadline 6 October 23:55 EAT, no recruitment fees and no bank account information requests. Preferred Prince II/ITIL credentials are not mandatory gates. Duplicate checked against catalog; replaces aggregator source for existing row.' },
    { ...base, id: '88888888-8888-4888-8888-000000000001', organizationId: '66666666-6666-4666-8666-000000000047', title: 'Global MEL Manager/Senior Manager', sourceUrl: 'https://oneacrefund.org/vacancies/global-mel-managersenior-manager', location: 'Jinja, Uganda; Minna, Nigeria; Kinshasa, DRC', deadline: '2026-11-17T00:00:00Z', publicationDate: now,
      description: 'Lead monitoring, evaluation and learning across One Acre Fund country programmes and manage shared team systems. Locations include Jinja, Minna and Kinshasa. Work-permit support is possible. Apply early: hiring is continuous and the vacancy may fill before 17 November 2026. The source gives no closing time; OppScout uses the start of that date conservatively.',
      eligibility: { additionalRequirements: ['Demonstrate advanced evaluation methods, Stata and R proficiency, and distributed people/project management.', 'Confirm placement and work-permit arrangements; nationals or candidates with substantial experience in operating countries are preferred.'] }, requiredSkills: ['stata', 'r', 'project management', 'people management', 'research', 'statistical analysis'],
      reviewNotes: 'Official vacancy reviewed 2026-10-02: https://oneacrefund.org/vacancies/global-mel-managersenior-manager. No recruitment fees, official application route, benefits and location conditions confirmed. Deadline is date-only; conservative start-of-day UTC stored, not a source-published closing instant. publicationDate is OppScout ingestion time; provider publication date not given. Duplicate checked against existing catalog.' },
    { ...base, id: '88888888-8888-4888-8888-000000000002', organizationId: '66666666-6666-4666-8666-000000000047', title: 'Grants Finance Senior Associate/Manager', sourceUrl: 'https://oneacrefund.org/vacancies/grants-finance-senior-associatemanager', location: 'Uganda and eligible One Acre Fund operating countries', deadline: null, publicationDate: now,
      description: 'One Acre Fund seeks a senior finance professional to oversee planning, reporting and financial controls across grants. The role requires eight or more years of relevant experience and a relevant bachelor’s degree. Applications are reviewed until a hire is made. This is employment, not a grant application.',
      eligibility: { educationLevels: ['bachelors', 'masters', 'phd'], fieldsOfStudy: ['finance', 'accounting', 'business', 'economics'], minimumExperienceMonths: 96, programmeRules: [{ field: 'language', allowedValues: ['English'], label: 'English language' }], additionalRequirements: ['Only citizens or permanent residents of Kenya, Uganda, Tanzania, Rwanda, Malawi, Zambia, Burundi or Nigeria may apply.', 'Confirm eight years of relevant finance experience. Professional accountancy qualification is strongly preferred, not mandatory.'] }, requiredSkills: ['financial planning', 'budgeting', 'forecasting', 'financial reporting', 'excel', 'communication'], preferredSkills: ['power bi', 'salesforce'],
      reviewNotes: 'Official vacancy reviewed 2026-10-02: https://oneacrefund.org/vacancies/grants-finance-senior-associatemanager. Explicit rolling recruitment with no fixed deadline, no recruitment fees, official application route and residence/citizenship restrictions checked. publicationDate is OppScout ingestion time; provider publication date not given. Duplicate checked against existing catalog.' },
  ];
  for (const job of jobs) {
    if (snapshot.opportunities.some(row => row.id !== job.id && (row.sourceUrl === job.sourceUrl || (row.organizationId === job.organizationId && titleSimilarity(row.title, job.title) >= 0.85)))) throw new Error(`Review potential duplicate: ${job.title}`);
  }
  writeFileSync('docs/audits/reviewed-jobs.json', JSON.stringify(jobs, null, 2));
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', jobs: jobs.map(j => j.title) }));
  if (!apply) return;
  for (const job of jobs) {
    const existing = snapshot.opportunities.find(row => row.id === job.id);
    const response = existing
      ? await client.from('Opportunity').update(job).eq('id', job.id).eq('verificationStatus', 'pending').select('id')
      : await client.from('Opportunity').insert(job).select('id');
    if (response.error || response.data?.length !== 1) throw new Error(response.error?.message ?? 'Review already applied or concurrent change');
  }
  console.log('Verified write response for all 3 jobs.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
