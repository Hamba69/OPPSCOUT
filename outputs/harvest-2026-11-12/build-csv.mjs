import fs from 'node:fs/promises';
import { Workbook } from '@oai/artifact-tool';
const dir = new URL('./',import.meta.url);
const read = async n=>JSON.parse(await fs.readFile(new URL(n,dir),'utf8'));
const rows=await read('verified-rows.json'), ledger=await read('ledger-final.json'),cols=await read('csv-columns.json'),statuses=await read('source-statuses.json');
function column(n){let s='';for(;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
async function csv(name,headers,data){
 const matrix=[headers,...data.map(r=>headers.map(c=>String(r[c]??'')))];
 const workbook=Workbook.create(),sheet=workbook.worksheets.add('Data');
 const range=sheet.getRange(`A1:${column(headers.length)}${matrix.length}`);range.values=matrix;workbook.recalculate();
 const actual=range.values.map(r=>r.map(v=>v instanceof Date?v.toISOString().replace('.000Z','Z'):String(v??'')));
 if(JSON.stringify(actual)!==JSON.stringify(matrix)){for(let i=0;i<matrix.length;i++)for(let j=0;j<headers.length;j++)if(actual[i]?.[j]!==matrix[i][j])console.log({row:i,column:headers[j],expected:matrix[i][j],actual:actual[i]?.[j]});throw Error('Artifact cell roundtrip mismatch');}
 const quote=v=>'"'+v.replaceAll('"','""')+'"';
 await fs.writeFile(new URL(name,dir),actual.map(r=>r.map(quote).join(',')).join('\r\n')+'\r\n','utf8');
 console.log(`${name}: ${data.length} rows, ${headers.length} columns`);
}
await csv('oppscout_verified_2026-11-12.csv',cols,rows);
await csv('oppscout_rejected_2026-11-12.csv',['candidate_id','title','organization_name','source_url','tier','reason','category'],ledger.filter(r=>r.status==='rejected').map(r=>({...r,organization_name:r.org})));
await csv('working-ledger.csv',['candidate_id','title','org','source_url','tier','status','reason'],ledger);
const domains=new Set([...Object.keys(statuses),...ledger.map(r=>new URL(r.source_url).hostname)]);
const sources=[...domains].sort().map(domain=>{const selected=ledger.filter(r=>new URL(r.source_url).hostname===domain);return {domain,tier:selected[0]?.tier??'B',access_status:statuses[domain]?.[0]??'not_reached',rows_verified:selected.filter(r=>r.status==='verified').length,rows_rejected:selected.filter(r=>r.status==='rejected').length,notes:statuses[domain]?.[1]??'Search-index lead only; provider page not fetched in this run.'};});
await csv('oppscout_source_log_2026-11-12.csv',['domain','tier','access_status','rows_verified','rows_rejected','notes'],sources);
