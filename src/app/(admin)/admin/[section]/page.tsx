import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPortal } from "@/lib/admin-portal";
import { DATASETS, isDataset, parseAdminQuery, type Dataset, type AdminSnapshot } from "@/lib/admin-data";
import { ADMIN_SECTIONS } from "@/lib/admin-sections";
import { getRepository } from "@/lib/repository";
import { AdminHeader, ChipLinks } from "@/components/admin-header";
import { AdminTable } from "@/components/admin-table";
import { AdminChart, type ChartKind } from "@/components/admin-charts";
import { AdminAlgorithm } from "@/components/admin-algorithm";
import { AI_RULES } from "@/config/ai-rules";
import { AdminOverview } from "@/components/admin-overview";
import { AdminPublishers } from "@/components/admin-publishers";
import { isPublisherOrganization, summarizeCatalogue } from "@/services/admin/catalogue-summary";

export const dynamic="force-dynamic";
function display(value:number|null|undefined):string{return value==null?"No data yet":Number(value.toFixed(2)).toLocaleString();}
/** "Completed profiles %" -> ["Completed profiles", "%"], "p95 API latency (ms)" -> ["p95 API latency", " ms"]. */
function metricUnit(label:string):[string,string]{if(label.endsWith(" %"))return [label.slice(0,-2),"%"];const ms=label.match(/^(.*) \(ms\)$/);return ms?[ms[1]!," ms"]:[label,""];}
function ratio(h:AdminSnapshot["headlines"],a:string,b:string):number|null{return h[b]?Number(h[a]??0)/Number(h[b])*100:null;}
export default async function AdminSection({params,searchParams}:{params:Promise<{section:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}):Promise<React.JSX.Element>{
  await requireAdminPortal();const {section}=await params,spec=ADMIN_SECTIONS[section];if(!spec)notFound();
  const values=await searchParams,url=new URLSearchParams();for(const [key,value] of Object.entries(values))if(typeof value==="string")url.set(key,value);
  const period=[7,30,90].includes(Number(url.get("period")))?Number(url.get("period")):30,now=new Date(),from=new Date(now.getTime()-period*86400000),repository=await getRepository();
  const [snapshot,previous]=await Promise.all([repository.adminSnapshot(from,now),section==="overview"?repository.adminSnapshot(new Date(from.getTime()-period*86400000),from):Promise.resolve(null)]);
  const h=snapshot.headlines;let accumulated=Number(h.users??0)-Number(h.newUsers??0);
  const cumulative=snapshot.series.filter(p=>p.group==="signups").sort((a,b)=>a.label.localeCompare(b.label)).map(p=>({...p,group:"cumulative",value:(accumulated+=p.value)}));
  const series=[...snapshot.series,...cumulative],path=`/admin/${section}`;
  const selected=url.get("dataset"),dataset=selected&&isDataset(selected)&&spec.datasets.includes(selected)?selected:spec.datasets[0];
  const metrics:Array<[string,number|null|undefined,number|null|undefined]> = section==="overview"?[
  ]:section==="feedback"?[["Submissions",h.feedback,null],["Average rating",h.averageRating,null]]:section==="matching"||section==="algorithm"?[[`Scores ≥ ${AI_RULES.relevanceThreshold} %`,ratio(h,"aboveThreshold","scored"),null],["Runs",h.runs,null],["Average run duration (ms)",h.runAverageMs,null],["p95 run duration (ms)",h.runP95Ms,null],["Candidates per run",h.candidatesPerRun,null],["Top-three engagement events",h.topThreeEngagement,null]]:section==="performance"?[["USSD completion %",ratio(h,"ussdOk","ussdSamples"),null],["Terminal USSD sessions",h.ussdSamples,null]]:[];
  const extraGroups=section==="performance"?series.filter(p=>p.group.startsWith("vitals-rating:")||p.group.startsWith("history:")).map(p=>p.group):section==="algorithm"?series.filter(p=>p.group.startsWith("history:match:")).map(p=>p.group):[];
  const charts=[...spec.groups,...[...new Set(extraGroups)].map(group=>[group,group.replace(/:/g," "),"bar"] as [string,string,ChartKind])];
  const periodHref=(days:string)=>{const next=new URLSearchParams(url);next.set("period",days);next.delete("page");return `${path}?${next.toString()}`;};
  // The overview and publishers pages read canonical records directly: the catalogue's state right now,
  // and only organisations that signed up in the app (seeded providers never need publisher verification).
  const [allOpportunities,allOrganizations]=section==="overview"||section==="organizations"?await Promise.all([repository.listOpportunities(),repository.listOrganizations()]):[[],[]];
  return <main className="min-w-0 flex-1 animate-in flex flex-col gap-6">
    <AdminHeader title={spec.title} subtitle={section==="overview"?"What needs you today, what is in the catalogue, and who is using it.":section==="organizations"?"Organisations that signed up to post their own listings.":`${from.toISOString().slice(0,10)} to ${now.toISOString().slice(0,10)} · UTC`}>
      {section!=="organizations"&&<ChipLinks label="Period" current={String(period)} options={[["7","7 days"],["30","30 days"],["90","90 days"]]} href={periodHref}/>}
    </AdminHeader>
        {metrics.length>0&&<div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3 xl:grid-cols-4">{metrics.map(([label,value,before])=>{const [name,unit]=metricUnit(label);return <section className="stat-card" key={label}><h2 className="text-[13px] font-semibold text-navy">{name}</h2><div>{value==null?<p className="text-base font-bold text-navy">No data yet</p>:<p className="text-[1.875rem] font-extrabold leading-tight tracking-tight text-ink">{display(value)}{unit?<span className="text-lg font-bold">{unit}</span>:null}</p>}{section==="overview"&&<p className="text-xs text-navy">{value!=null&&before!=null?`${value-before>=0?"+":"−"}${display(Math.abs(value-before))} vs previous period`:"Previous period has no samples"}</p>}</div></section>;})}</div>}
    {section==="algorithm"&&<AdminAlgorithm snapshot={snapshot}/>}
    {section==="performance"&&<p className="rounded-2xl border border-[#FBE7A1] bg-[#FFF8DC] p-4 text-sm">Good / poor boundaries: LCP 2,500 / 4,000 ms; INP 200 / 500 ms; CLS 0.1 / 0.25; FCP 1,800 / 3,000 ms; TTFB 800 / 1,800 ms. Values between boundaries need improvement. Retained daily percentiles are shown separately and are never averaged into period percentiles.</p>}
    {section!=="overview"&&charts.length>0&&<div className="grid gap-5 xl:grid-cols-2">{charts.map(([group,title,kind])=><AdminChart key={group} title={title} points={series.filter(p=>p.group===group)} kind={kind}/>)}</div>}
    {section==="overview"&&<AdminOverview catalogue={summarizeCatalogue(allOpportunities,now)} publishersAwaitingVerification={allOrganizations.filter(o=>isPublisherOrganization(o)&&(o.verificationStatus==="pending"||o.verificationStatus==="flagged")).length} users={h} previousUsers={previous?.headlines??null} periodDays={period}/>}
    {section==="organizations"&&<AdminPublishers organizations={allOrganizations} opportunities={allOpportunities} now={now}/>}
    {section==="exports"&&<div className="grid gap-4 md:grid-cols-2">{await Promise.all((Object.keys(DATASETS) as Dataset[]).map(async key=>{const [all,recent]=await Promise.all([repository.adminPage(key,parseAdminQuery(key,new URLSearchParams())),repository.adminPage(key,parseAdminQuery(key,new URLSearchParams({from:new Date(now.getTime()-30*86400000).toISOString().slice(0,10)})))]);return <section className="card" key={key}><h2 className="text-xl font-extrabold capitalize">{key.replace(/-/g," ")}</h2><p className="mt-2 text-sm text-navy">{all.total.toLocaleString()} rows · {recent.total.toLocaleString()} in the last 30 days. All fields from {DATASETS[key].table}, with UTC dates.</p><a className="button-secondary mt-4" href={`/api/v1/admin/export/${key}`}>Download CSV</a></section>;}))}</div>}
    {spec.datasets.length>1&&<nav aria-label="Datasets" className="flex flex-wrap gap-1.5">{spec.datasets.map(key=><Link className="chip capitalize" aria-current={dataset===key?"page":undefined} key={key} href={`${path}?dataset=${key}&period=${period}`}>{key.replace(/-/g," ")}</Link>)}</nav>}
    {dataset==="unmatched-terms"&&<p className="text-sm text-navy">Add the most frequent terms to <code>ontology.ts</code> each week.</p>}
    {dataset&&<AdminTable dataset={dataset} params={url} path={path}/>}
  </main>;
}
