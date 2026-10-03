import { randomUUID } from "node:crypto";
import { DATASETS, type AdminQuery, type AdminSnapshot, type DataRow, type Dataset } from "@/lib/admin-data";

export function memoryPage(rows: DataRow[], dataset: Dataset, query: AdminQuery) {
  const spec = DATASETS[dataset];
  const filtered = rows.filter(row => (!query.from || String(row[spec.date]) >= query.from) && (!query.to || String(row[spec.date]) < `${query.to}T23:59:59.999Z`) && (!query.search || String(row[spec.search] ?? "").toLowerCase().includes(query.search.toLowerCase())) && Object.entries(query.filters).every(([key, value]) => key === "identity" ? (row.userId != null) === (value === "signed-in") : String(row[key]) === value));
  const compare = (a: DataRow, b: DataRow) => {
    const x = a[query.sort], y = b[query.sort];
    const order = x == null ? (y == null ? 0 : 1) : y == null ? -1 : (x < y ? -1 : x > y ? 1 : 0) * (query.direction === "asc" ? 1 : -1);
    return order || String(a.id).localeCompare(String(b.id));
  };
  filtered.sort(compare);
  const after = query.cursor ? filtered.filter(row => compare(row, { id: query.cursor!.id, [query.sort]: query.cursor!.value }) > 0) : filtered;
  const offset = query.export ? 0 : (query.page - 1) * query.size;
  return { total: filtered.length, rows: after.slice(offset, offset + (query.export ? 1000 : query.size)) };
}

export function memorySnapshot(data: (dataset: Dataset) => DataRow[], from: string, to: string): AdminSnapshot {
  const period = (dataset: Dataset) => data(dataset).filter(r => String(r[DATASETS[dataset].date]) >= from && String(r[DATASETS[dataset].date]) < to);
  const users = data("users"), opportunities = data("opportunities"), matches = data("matches"), saved = data("saved"), notifications = data("notifications"), events = period("events"), feedback = period("feedback"), requests = period("request-metrics"), runs = period("match-runs");
  const count = (type: string) => events.filter(e => e.eventType === type).length;
  const active = new Set(events.map(e => e.userId).filter(Boolean));
  const orgs = new Map<string, number>(); for (const o of opportunities.filter(o => o.origin === "organization")) orgs.set(String(o.organizationId), (orgs.get(String(o.organizationId)) ?? 0) + 1);
  const sum = (rows: DataRow[], key: string) => rows.reduce((n, r) => n + Number(r[key] ?? 0), 0);
  const api = requests.filter(r => r.kind === "api"), ussd = requests.filter(r => r.kind === "ussd");
  const headlines: AdminSnapshot["headlines"] = { users: users.length, newUsers: period("users").length, activeUsers: active.size, completeProfiles: users.filter(u => Number(u.profileCompletenessScore) >= 80).length, opportunities: opportunities.length, verifiedOpportunities: opportunities.filter(o => o.verificationStatus === "verified").length, openVerified: opportunities.filter(o => o.verificationStatus === "verified" && ["open", "closing_soon"].includes(String(o.status)) && (!o.deadline || String(o.deadline) >= to)).length, matches: matches.length, matchesGenerated: sum(runs,"scored"), views: count("view"), saves: count("save"), clicks: count("click"), applyIntents: count("apply_intent"), saved: saved.length, decidedSaves: saved.filter(s => s.status === "applied" || opportunities.some(o => o.id === s.opportunityId && o.deadline && String(o.deadline) < to)).length, appliedSaves: saved.filter(s => s.status === "applied").length, notifications: notifications.length, delivered: notifications.filter(n => ["sent","delivered"].includes(String(n.status))).length, notificationClicks: events.filter(e => e.eventType === "click" && (e.metadata as DataRow)?.source === "notification").length, ussdActive: users.filter(u => u.preferredChannel === "ussd" && active.has(u.id)).length, postingOrganizations: orgs.size, repeatOrganizations: [...orgs.values()].filter(n => n>1).length, feedback: feedback.length, averageRating: feedback.length ? sum(feedback,"rating")/feedback.length : null, apiSamples: api.length, apiOk: api.filter(r => r.ok).length, p95Api: percentile(api.map(r => Number(r.durationMs)),.95), apiErrorRate: api.length ? api.filter(r => !r.ok).length/api.length*100 : null, ussdSamples: ussd.length, ussdOk: ussd.filter(r => r.ok).length, reviewed: opportunities.filter(o => o.reviewedAt).length, reviewHours: null, fresh: opportunities.filter(o => o.status === "open" || o.status === "closing_soon").length, runs: runs.length, aboveThreshold: sum(runs,"aboveThreshold"), scored: sum(runs,"scored"), runAverageMs: runs.length ? sum(runs,"durationMs")/runs.length : null, runP95Ms: percentile(runs.map(r => Number(r.durationMs)),.95), candidatesPerRun: runs.length ? sum(runs,"candidatesConsidered")/runs.length : null, topThreeEngagement: events.filter(e => ["save","click","apply_intent"].includes(String(e.eventType)) && Number((e.metadata as DataRow)?.rank)>0 && Number((e.metadata as DataRow)?.rank)<=3).length };
  const series: AdminSnapshot["series"] = [];
  const group = (rows: DataRow[], name: string, key: (row: DataRow) => string) => { const counts = new Map<string,number>(); for (const row of rows) { const label = key(row); counts.set(label,(counts.get(label)??0)+1); } for (const [label,value] of counts) series.push({ group:name,label,value,samples:value }); };
  group(period("users"),"signups",r => String(r.createdAt).slice(0,10)); group(events,"funnel",r=>String(r.eventType));
  for (const [name,key] of Object.entries({location:"location",education:"educationLevel",field:"fieldOfStudy",channel:"preferredChannel"})) group(users,name,r=>String(r[key]??"Not recorded"));
  group(users,"completeness",r=>Number(r.profileCompletenessScore)>=80?"80–100":Number(r.profileCompletenessScore)>=50?"50–79":"0–49");
  for (const key of ["category","rating","status"]) group(feedback,`feedback:${key}`,r=>String(r[key]));
  group(matches,"scores",r=>String(Math.min(9,Math.floor(Number(r.score)/10))*10));
  return { headlines, series };
}
export function percentile(values: number[], fraction: number): number | null { if (!values.length) return null; const sorted=[...values].sort((a,b)=>a-b); const at=(sorted.length-1)*fraction; const low=Math.floor(at); return sorted[low]!+(sorted[Math.ceil(at)]!-sorted[low]!)*(at-low); }
export class MemoryAdminStore {
  readonly rows = new Map<Dataset,DataRow[]>();
  constructor(private readonly data: (dataset: Dataset) => DataRow[]) {}
  async rpc(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (name === "admin_data_page") return memoryPage(this.data(args.dataset as Dataset),args.dataset as Dataset,args.options as AdminQuery);
    if (name === "admin_snapshot") return memorySnapshot(this.data,String(args.start_at),String(args.end_at));
    if (name === "retain_telemetry") { for (const [key,days] of [["request-metrics",30],["web-vitals",30],["match-runs",180]] as const) this.rows.set(key,this.data(key).filter(r=>Date.parse(String(r.createdAt))>=Date.parse(String(args.at_time))-days*86400000)); return null; }
    const p=args.payload as DataRow, op=args.operation;
    const add=(dataset: Dataset,row: DataRow) => { const rows=this.rows.get(dataset)??[]; rows.push({id:randomUUID(),createdAt:new Date().toISOString(),...row});this.rows.set(dataset,rows); };
    const exists=()=>this.data("feedback").some(r=>r.visitorHash===p.visitorHash || (p.userId && r.userId===p.userId));
    if(op==="feedback_exists") return exists();
    if(op==="feedback") { if(exists()) throw new Error("23505"); if(this.data("feedback").filter(r=>r.ipHash===p.ipHash && Date.parse(String(r.createdAt))>Date.now()-86400000).length>=10) throw new Error("FEEDBACK_DAILY_LIMIT"); add("feedback",{...p,status:"new",adminNote:null,updatedAt:new Date().toISOString()}); }
    else if(op==="feedback_update") { const row=this.data("feedback").find(r=>r.id===p.id);if(!row) throw new Error("FEEDBACK_NOT_FOUND");Object.assign(row,p,{updatedAt:new Date().toISOString()}); }
    else if(op==="request") add("request-metrics",p);
    else if(op==="vitals") for(const row of args.payload as DataRow[]) add("web-vitals",row);
    else if(op==="access") add("access-log",p);
    else if(op==="match_run") { add("match-runs",p.run as DataRow); for(const term of p.terms as DataRow[]) { const row=this.data("unmatched-terms").find(r=>r.kind===term.kind&&r.term===term.term);if(row) { row.count=Number(row.count)+1;row.lastSeenAt=new Date().toISOString(); } else add("unmatched-terms",{...term,count:1,firstSeenAt:new Date().toISOString(),lastSeenAt:new Date().toISOString()}); } }
    else throw new Error("Unknown admin operation");
    return null;
  }
}
