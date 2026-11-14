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
    ["Total users",h.users,previous?.headlines.users],["New users",h.newUsers,previous?.headlines.newUsers],["Active users",h.activeUsers,previous?.headlines.activeUsers],["Completed profiles %",ratio(h,"completeProfiles","users"),previous?ratio(previous.headlines,"completeProfiles","users"):null],["Open verified opportunities",h.openVerified,previous?.headlines.openVerified],["Matches generated",h.matchesGenerated,previous?.headlines.matchesGenerated],["Saves",h.saves,previous?.headlines.saves],["Application intents",h.applyIntents,previous?.headlines.applyIntents],["Feedback",h.feedback,previous?.headlines.feedback],["Average rating",h.averageRating,previous?.headlines.averageRating],["p95 API latency (ms)",h.p95Api,previous?.headlines.p95Api],["API error rate %",h.apiErrorRate,previous?.headlines.apiErrorRate]
  ]:section==="feedback"?[["Submissions",h.feedback,null],["Average rating",h.averageRating,null]]:section==="organizations"?[["Repeat posting rate %",ratio(h,"repeatOrganizations","postingOrganizations"),null]]:section==="matching"||section==="algorithm"?[[`Scores ≥ ${AI_RULES.relevanceThreshold} %`,ratio(h,"aboveThreshold","scored"),null],["Runs",h.runs,null],["Average run duration (ms)",h.runAverageMs,null],["p95 run duration (ms)",h.runP95Ms,null],["Candidates per run",h.candidatesPerRun,null],["Top-three engagement events",h.topThreeEngagement,null]]:section==="performance"?[["USSD completion %",ratio(h,"ussdOk","ussdSamples"),null],["Terminal USSD sessions",h.ussdSamples,null]]:[];
  const extraGroups=section==="performance"?series.filter(p=>p.group.startsWith("vitals-rating:")||p.group.startsWith("history:")).map(p=>p.group):section==="algorithm"?series.filter(p=>p.group.startsWith("history:match:")).map(p=>p.group):[];
  const charts=[...spec.groups,...[...new Set(extraGroups)].map(group=>[group,group.replace(/:/g," "),"bar"] as [string,string,ChartKind])];
  const periodHref=(days:string)=>{const next=new URLSearchParams(url);next.set("period",days);next.delete("page");return `${path}?${next.toString()}`;};
  return <main className="min-w-0 flex-1 animate-in flex flex-col gap-6">
    <AdminHeader title={spec.title} subtitle={section==="overview"?"Platform health at a glance.":`${from.toISOString().slice(0,10)} to ${now.toISOString().slice(0,10)} · UTC`}>
      <ChipLinks label="Period" current={String(period)} options={[["7","7 days"],["30","30 days"],["90","90 days"]]} href={periodHref}/>
    </AdminHeader>
        {metrics.length>0&&<div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3 xl:grid-cols-4">{metrics.map(([label,value,before])=>{const [name,unit]=metricUnit(label);return <section className="stat-card" key={label}><h2 className="text-[13px] font-semibold text-navy">{name}</h2><div>{value==null?<p className="text-base font-bold text-navy">No data yet</p>:<p className="text-[1.875rem] font-extrabold leading-tight tracking-tight text-ink">{display(value)}{unit?<span className="text-lg font-bold">{unit}</span>:null}</p>}{section==="overview"&&<p className="text-xs text-navy">{value!=null&&before!=null?`${value-before>=0?"+":"−"}${display(Math.abs(value-before))} vs previous period`:"Previous period has no samples"}</p>}</div></section>;})}</div>}
    {section==="algorithm"&&<AdminAlgorithm snapshot={snapshot}/>}
    {section==="performance"&&<p className="rounded-2xl border border-[#FBE7A1] bg-[#FFF8DC] p-4 text-sm">Good / poor boundaries: LCP 2,500 / 4,000 ms; INP 200 / 500 ms; CLS 0.1 / 0.25; FCP 1,800 / 3,000 ms; TTFB 800 / 1,800 ms. Values between boundaries need improvement. Retained daily percentiles are shown separately and are never averaged into period percentiles.</p>}
    {section!=="overview"&&<div className="grid gap-5 xl:grid-cols-2">{charts.map(([group,title,kind])=><AdminChart key={group} title={title} points={series.filter(p=>p.group===group)} kind={kind}/>)}</div>}
    {section==="overview"&&<div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"><UserFunnel steps={[["Registered",h.users],["Complete profiles",h.completeProfiles],["Active",h.activeUsers]]}/><LatestFeedback/></div>}
    {section==="exports"&&<div className="grid gap-4 md:grid-cols-2">{await Promise.all((Object.keys(DATASETS) as Dataset[]).map(async key=>{const [all,recent]=await Promise.all([repository.adminPage(key,parseAdminQuery(key,new URLSearchParams())),repository.adminPage(key,parseAdminQuery(key,new URLSearchParams({from:new Date(now.getTime()-30*86400000).toISOString().slice(0,10)})))]);return <section className="card" key={key}><h2 className="text-xl font-extrabold capitalize">{key.replace(/-/g," ")}</h2><p className="mt-2 text-sm text-navy">{all.total.toLocaleString()} rows · {recent.total.toLocaleString()} in the last 30 days. All fields from {DATASETS[key].table}, with UTC dates.</p><a className="button-secondary mt-4" href={`/api/v1/admin/export/${key}`}>Download CSV</a></section>;}))}</div>}
    {spec.datasets.length>1&&<nav aria-label="Datasets" className="flex flex-wrap gap-1.5">{spec.datasets.map(key=><Link className="chip capitalize" aria-current={dataset===key?"page":undefined} key={key} href={`${path}?dataset=${key}&period=${period}`}>{key.replace(/-/g," ")}</Link>)}</nav>}
    {dataset==="unmatched-terms"&&<p className="text-sm text-navy">Add the most frequent terms to <code>ontology.ts</code> each week.</p>}
    {dataset&&<AdminTable dataset={dataset} params={url} path={path}/>}
  </main>;
}
async function LatestFeedback(){const page=await(await getRepository()).adminPage("feedback",parseAdminQuery("feedback",new URLSearchParams()));return <section className="surface"><h2 className="surface-title">Latest feedback</h2>
  {page.rows.length?<ul className="mt-3">{page.rows.slice(0,3).map(row=><li key={String(row.id)} className="border-t border-ink/[.07] py-3"><div className="flex items-center justify-between gap-2"><span className="cat-pill">{String(row.category).replace(/_/g," ")}</span><span className="text-xs font-bold text-ink">{String(row.rating)}/5</span></div><p className="mt-2 text-[13px] leading-5 text-navy">{String(row.message)}</p></li>)}</ul>:<p className="mt-3 text-sm text-navy">No data yet.</p>}</section>;}

/** Simple horizontal bars: each step as a share of the first step. */
function UserFunnel({steps}:{steps:Array<[string,number|null|undefined]>}){const first=Number(steps[0]?.[1]??0);return <section className="surface" aria-labelledby="user-funnel"><h2 id="user-funnel" className="surface-title">User funnel</h2>
  <dl className="mt-4 flex flex-col gap-4">{steps.map(([label,value])=>{const count=Number(value??0),pct=first>0?Math.round(count/first*100):0;return <div key={label} className="grid grid-cols-[9.5rem_minmax(0,1fr)_3.5rem] items-center gap-3.5"><dt className="text-[13px] font-semibold text-ink">{label}</dt><dd className="h-3 overflow-hidden rounded-full bg-ink/[.06]" role="img" aria-label={`${label}: ${count.toLocaleString()} (${pct}% of registered)`}><span className="block h-full rounded-full bg-gradient-to-r from-[#FFE27A] to-[#FFC700]" style={{width:`${pct}%`}}/></dd><dd className="text-right text-[13px] font-bold text-ink">{count.toLocaleString()}</dd></div>;})}</dl></section>;}
