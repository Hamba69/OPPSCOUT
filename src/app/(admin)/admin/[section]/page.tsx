import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPortal } from "@/lib/admin-portal";
import { DATASETS, isDataset, parseAdminQuery, type Dataset, type AdminSnapshot, type AggregatePoint } from "@/lib/admin-data";
import { ADMIN_SECTIONS } from "@/lib/admin-sections";
import { getRepository } from "@/lib/repository";
import { AdminTable } from "@/components/admin-table";
import { AdminChart, type ChartKind } from "@/components/admin-charts";
import { AdminAlgorithm } from "@/components/admin-algorithm";
import { AI_RULES } from "@/config/ai-rules";

export const dynamic="force-dynamic";
function display(value:number|null|undefined):string{return value==null?"No data yet":Number(value.toFixed(2)).toLocaleString();}
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
  return <main className="min-w-0 flex-1 px-4 py-8 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-extrabold text-ink">{spec.title}</h1><form><label className="text-sm text-navy">Period <select className="field inline-block !w-auto" name="period" defaultValue={period}>{[7,30,90].map(days=><option key={days} value={days}>{days} days</option>)}</select></label><button className="button-secondary ml-2">Update</button></form></div>
    <p className="mt-2 text-sm text-navy">{from.toISOString().slice(0,10)} to {now.toISOString().slice(0,10)} · UTC. Event charts describe recorded activity; profile and listing breakdowns describe current records.</p>
    {metrics.length>0&&<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label,value,before])=><section className="card" key={label}><h2 className="text-sm text-navy">{label}</h2><p className="mt-2 text-3xl font-extrabold">{display(value)}</p>{section==="overview"&&<p className="mt-2 text-xs text-navy">{value!=null&&before!=null?`${value-before>=0?"+":""}${display(value-before)} vs previous period`:"Previous period has no samples"}</p>}</section>)}</div>}
    {section==="algorithm"&&<AdminAlgorithm snapshot={snapshot}/>}
    {section==="performance"&&<p className="mt-4 rounded-xl bg-butter p-4 text-sm">Good / poor boundaries: LCP 2,500 / 4,000 ms; INP 200 / 500 ms; CLS 0.1 / 0.25; FCP 1,800 / 3,000 ms; TTFB 800 / 1,800 ms. Values between boundaries need improvement. Retained daily percentiles are shown separately and are never averaged into period percentiles.</p>}
    <div className="mt-6 grid gap-5 xl:grid-cols-2">{charts.map(([group,title,kind])=><AdminChart key={group} title={title} points={series.filter(p=>p.group===group)} kind={kind}/>)}</div>
    {section==="overview"&&<><AdminChart title="User funnel" kind="funnel" points={[["Registered",h.users],["Complete profiles",h.completeProfiles],["Active",h.activeUsers]].map(([label,value])=>({group:"users",label:String(label),value:Number(value??0)} as AggregatePoint))}/><LatestFeedback/></>}
    {section==="exports"&&<div className="mt-6 grid gap-4 md:grid-cols-2">{await Promise.all((Object.keys(DATASETS) as Dataset[]).map(async key=>{const [all,recent]=await Promise.all([repository.adminPage(key,parseAdminQuery(key,new URLSearchParams())),repository.adminPage(key,parseAdminQuery(key,new URLSearchParams({from:new Date(now.getTime()-30*86400000).toISOString().slice(0,10)})))]);return <section className="card" key={key}><h2 className="text-xl font-extrabold capitalize">{key.replace(/-/g," ")}</h2><p className="mt-2 text-sm text-navy">{all.total.toLocaleString()} rows · {recent.total.toLocaleString()} in the last 30 days. All fields from {DATASETS[key].table}, with UTC dates.</p><a className="button-secondary mt-4" href={`/api/v1/admin/export/${key}`}>Download CSV</a></section>;}))}</div>}
    {spec.datasets.length>1&&<nav aria-label="Datasets" className="mt-6 flex flex-wrap gap-2">{spec.datasets.map(key=><Link className="button-secondary" aria-current={dataset===key?"page":undefined} key={key} href={`${path}?dataset=${key}&period=${period}`}>{key.replace(/-/g," ")}</Link>)}</nav>}
    {dataset==="unmatched-terms"&&<p className="mt-5 text-sm text-navy">Add the most frequent terms to <code>ontology.ts</code> each week.</p>}
    {dataset&&<AdminTable dataset={dataset} params={url} path={path}/>}
  </main>;
}
async function LatestFeedback(){const page=await(await getRepository()).adminPage("feedback",parseAdminQuery("feedback",new URLSearchParams()));return <section className="card mt-6"><h2 className="text-xl font-extrabold">Latest feedback</h2>{page.rows.slice(0,5).map(row=><p key={String(row.id)} className="mt-3 border-t border-ink/10 pt-3 text-sm"><strong>{String(row.category)} · {String(row.rating)}/5</strong><br/>{String(row.message)}</p>)}{!page.rows.length&&<p className="mt-3 text-navy">No data yet.</p>}<Link className="button-secondary mt-4" href="/admin/feedback">Open inbox</Link></section>;}
