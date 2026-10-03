import { SloGauge, sloStatus } from "@/components/dashboard-charts";
import { SLO_TARGETS } from "@/config/slo-targets";
import { requireAdminPortal } from "@/lib/admin-portal";
import { getRepository } from "@/lib/repository";
import { getSloSnapshot } from "@/services/monitoring/metrics";

export const dynamic = "force-dynamic";

function valueLabel(value: number | null, unit: "percent" | "hours"): string {
  return value === null ? "Collecting data" : `${value}${unit === "percent" ? "%" : "h"}`;
}

export default async function SloPage(): Promise<React.JSX.Element> {
  await requireAdminPortal();
  const snapshot = await getSloSnapshot(await getRepository());
  const live = {
    coreApi: snapshot.apiUptime.value,
    notificationDelivery: snapshot.notificationDelivery.value,
    dataFreshness: snapshot.dataFreshness.value,
    matchRelevance: snapshot.matchRelevance.value,
    trustTurnaround: snapshot.trustTurnaround.value,
    ussdCompletion: snapshot.ussdCompletion.value,
  } as const;
  return <main className="page-shell animate-in"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">System health</h1><p className="mt-2 text-navy">Separate numbers for separate promises. Sparse early data stays visible. Each marker shows the target; a dashed track means there are no samples yet.</p><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Object.entries(SLO_TARGETS).map(([key, target]) => { const value = key in live ? live[key as keyof typeof live] : null; const status = sloStatus(value, target); const tone = status === "Met" ? "border-l-4 border-l-leaf text-leaf" : status === "At risk" ? "border-l-4 border-l-coral text-ink" : "border-dashed border-ink/20 text-navy"; return <article className={`card ${tone}`} key={key}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-extrabold text-ink">{target.metric}</p><span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-bold">{status}</span></div><p className="mt-3 text-3xl font-extrabold">{valueLabel(value, target.unit)}</p><SloGauge value={value} target={target} /><p className="mt-2 text-sm text-navy">Target {target.target === null ? "" : target.direction === "at-least" ? "≥" : "≤"} {target.target === null ? "baseline first" : `${target.target}${target.unit === "percent" ? "%" : "h"}`}</p><p className="mt-4 text-xs font-semibold text-navy">Owner: {target.owner}</p></article>; })}</div><p className="mt-6 text-xs text-navy">Generated {new Date(snapshot.generatedAt).toLocaleString("en-UG")}</p></main>;
}
