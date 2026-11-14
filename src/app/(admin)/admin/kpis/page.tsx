import { AdminHeader } from "@/components/admin-header";
import { KpiTrend } from "@/components/dashboard-charts";
import { requireAdminPortal } from "@/lib/admin-portal";
import { getRepository } from "@/lib/repository";
import { getKpiSnapshot } from "@/services/kpi/dashboard";
export const dynamic = "force-dynamic";
export default async function KpiPage(): Promise<React.JSX.Element> { await requireAdminPortal(); const snapshot = await getKpiSnapshot(await getRepository()); return <main className="animate-in flex flex-col gap-6"><AdminHeader title="Ten KPIs, no guesswork." subtitle={`Live calculations from canonical records. Window: ${snapshot.periodDays} days.`}/><div className="grid gap-4 md:grid-cols-2">{snapshot.metrics.map((item) => <section className="card" key={item.key}><div className="flex items-start justify-between gap-4"><div><h2 className="font-extrabold text-ink">{item.label}</h2><p className="mt-1 text-xs text-navy">Sample {item.sampleSize}</p></div><p className="text-3xl font-extrabold">{item.value}{item.unit === "percent" ? "%" : item.unit === "ratio" ? "×" : ""}</p></div><KpiTrend metric={item} periodDays={snapshot.periodDays} illustrative={false} /></section>)}</div></main>; }
