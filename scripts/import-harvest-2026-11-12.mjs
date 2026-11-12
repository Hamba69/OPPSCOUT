import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';

nextEnv.loadEnvConfig(process.cwd());
const dir = 'outputs/harvest-2026-11-12';
const apply = process.argv.includes('--apply');
const snapshotOnly = process.argv.includes('--snapshot');
const now = new Date();
const normalize = s => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
async function main() {
  if (now.toISOString().slice(0,10) !== '2026-11-12') throw new Error('Dated source review must be refreshed.');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration missing.');
  const client = createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false}});
  const existing = [];
  for (let offset=0;;offset+=500) {
    const {data,error} = await client.from('Opportunity').select('id,title,organizationId,organizationName,sourceUrl,deadline,status,verificationStatus').order('id').range(offset,offset+499);
    if(error) throw new Error(`Catalogue read failed: ${error.code}`);
    existing.push(...data); if(data.length<500) break;
  }
  if (snapshotOnly) {
    writeFileSync(`${dir}/live-catalog-before.json`, JSON.stringify({capturedAt:now.toISOString(),target:new URL(url).hostname,opportunities:existing},null,2));
    console.log(JSON.stringify({mode:'snapshot',count:existing.length,target:new URL(url).hostname})); return;
  }
  const inputText = readFileSync(`${dir}/verified-rows.json`,'utf8');
  const records = JSON.parse(inputText);
  const hash = createHash('sha256').update(inputText).digest('hex');
  const checklist = {sourceAuthentic:true,officialApplicationLink:true,eligibleForUgandans:true,noInappropriateFees:true,noSensitiveDataAsk:true,deadlinePlausible:true,duplicateChecked:true};
  const duplicates = records.filter(r => existing.some(e => normalize(e.title)===normalize(r.title) || (e.sourceUrl===r.source_url && !e.sourceUrl.endsWith('/Opportunities.aspx'))));
  if(duplicates.length) throw new Error(`Duplicate review required: ${duplicates.map(r=>r.record_key).join(', ')}`);
  const rows = records.map(r=>{
    // Existing catalogue convention: start of the source closing date is an operational
    // expiry bound, never a claimed provider closing time. Preserve exact source precision.
    const cutoff = r.deadline_utc || (r.deadline_date ? `${r.deadline_date}T00:00:00Z` : null);
    const expired = cutoff && new Date(cutoff)<=now;
    const notes = {harvestRecordKey:r.record_key,sourceDeadline:{date:r.deadline_date,utc:r.deadline_utc,precision:r.deadline_precision,timezone:r.deadline_timezone,text:r.deadline_original_text},operationalExpiryPolicy:r.deadline_utc?'source_published_instant':'conservative_start_of_closing_date_UTC_not_source_time',sourcePublicationDate:r.source_publication_date || null,publicationDateMeaning:r.source_publication_date?'source_date_stored_at_UTC_midnight':'OppScout ingestion timestamp; source publication date unknown',applicantType:r.applicant_type,compensationStatus:r.compensation_status,compensationDetails:r.compensation_details,additionalCosts:r.additional_costs,applicationUrl:r.application_url,officialProviderUrl:r.organization_official_url,regionTier:r.region_tier,audienceLabel:r.audience_label,evidence:JSON.parse(r.evidence_json),notes:r.review_notes};
    return {id:randomUUID(),organizationId:null,organizationName:r.organization_name,title:r.title,category:r.category,description:r.description + (r.compensation_details?` ${r.compensation_details}`:'') + ` Provider deadline: ${r.deadline_original_text}.` + (r.deadline_precision==='date'?' Closing timezone/time is not fully specified; the catalogue expires this listing conservatively at the start of that date UTC.':''),eligibility:JSON.parse(r.eligibility_json||'{}'),requiredSkills:JSON.parse(r.required_skills_json||'[]'),preferredSkills:JSON.parse(r.preferred_skills_json||'[]'),location:r.location,workMode:r.work_mode||'unknown',deadline:cutoff,applicationMethod:r.application_method,sourceUrl:r.source_url,verificationStatus:'verified',source:'scraped',origin:'catalog',publicationDate:r.source_publication_date?`${r.source_publication_date}T00:00:00Z`:now.toISOString(),checkedAt:r.checked_at_utc,status:expired?'closed':cutoff&&new Date(cutoff)-now<=7*86400000?'closing_soon':'open',reviewChecklist:checklist,reviewNotes:JSON.stringify(notes),reviewerId:'official-source-review:2026-11-12',reviewedAt:now.toISOString()};
  });
  const plan = {target:new URL(url).hostname,inputHash:hash,existingCount:existing.length,records:rows.map(r=>({title:r.title,status:r.status,organizationId:r.organizationId,deadline:r.deadline})),count:rows.length};
  if(!apply){writeFileSync(`${dir}/import-plan.json`,JSON.stringify(plan,null,2));console.log(JSON.stringify({mode:'dry-run',...plan},null,2));return;}
  if(existsSync(`${dir}/import-receipt.json`)) throw new Error('Existing import receipt; refusing re-apply.');
  const reviewedPlan=JSON.parse(readFileSync(`${dir}/import-plan.json`,'utf8'));
  if(reviewedPlan.inputHash!==hash || reviewedPlan.target!==plan.target || reviewedPlan.existingCount!==existing.length) throw new Error('Preflight changed; repeat dry-run.');
  writeFileSync(`${dir}/import-intent.json`,JSON.stringify({at:now.toISOString(),target:plan.target,rows},null,2),{flag:'wx'});
  const {data,error}=await client.from('Opportunity').insert(rows).select('id,title,organizationId,organizationName,verificationStatus,status,reviewChecklist,sourceUrl,deadline');
  if(error) throw new Error(`Insert failed: ${error.code}`);
  const ids=rows.map(r=>r.id);
  const check=await client.from('Opportunity').select('*').in('id',ids);
  if(check.error || check.data.length!==rows.length) throw new Error('Read-back count failed.');
  for(const expected of rows){const actual=check.data.find(r=>r.id===expected.id);for(const key of Object.keys(expected)){let a=actual[key],e=expected[key];if(['deadline','publicationDate','checkedAt','reviewedAt'].includes(key)&&a&&e){a=new Date(/[zZ]|[+-]\d\d:\d\d$/.test(a)?a:`${a}Z`).toISOString();e=new Date(e).toISOString();}if(JSON.stringify(a)!==JSON.stringify(e)&&typeof e!=='object')throw new Error(`Read-back mismatch: ${key}`);}if(actual.organizationId!==null||Object.keys(checklist).some(k=>actual.reviewChecklist[k]!==true))throw new Error('Trust or standalone read-back failed.');}
  const total=await client.from('Opportunity').select('id',{count:'exact',head:true});
  if(total.error) throw new Error('Final count failed.');
  writeFileSync(`${dir}/import-receipt.json`,JSON.stringify({at:new Date().toISOString(),target:plan.target,inputHash:hash,inserted:data,totalAfter:total.count,readBack:'passed',organizationsCreated:0,existingRowsUpdated:0},null,2));
  console.log(JSON.stringify({mode:'applied',inserted:rows.length,active:rows.filter(r=>r.status!=='closed').length,closed:rows.filter(r=>r.status==='closed').length,readBack:'passed',totalAfter:total.count}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
