import { SLO_TARGETS } from "@/config/slo-targets";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { getSloSnapshot } from "@/services/monitoring/metrics";

export const dynamic = "force-dynamic";

function valueLabel(value: number | null, unit: "percent" | "hours"): string {
  return value === null ? "Collecting data" : `${value}${unit === "percent" ? "%" : "h"}`;
}

export default async function SloPage(): Promise<React.JSX.Element> {
  await requirePageAuth(["admin"]);
  const snapshot = await getSloSnapshot(await getRepository());
  const live = {
    coreApi: snapshot.apiUptime.value,
    notificationDelivery: snapshot.notificationDelivery.value,
    dataFreshness: snapshot.dataFreshness.value,
    matchRelevance: snapshot.matchRelevance.value,
    trustTurnaround: snapshot.trustTurnaround.value,
    ussdCompletion: snapshot.ussdCompletion.value,
  } as const;
  return <main className="page-shell"><p className="eyebrow">System health</p><h1 className="mt-2 text-4xl font-black">SLO dashboard</h1><p className="mt-2 text-ink/60">Separate numbers for separate promises. Sparse early data stays visible.</p><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Object.entries(SLO_TARGETS).map(([key, target]) => { const value = key in live ? live[key as keyof typeof live] : null; return <article className="card" key={key}><p className="text-sm font-black">{target.metric}</p><p className="mt-3 text-3xl font-black">{valueLabel(value, target.unit)}</p><p className="mt-2 text-sm text-ink/60">Target {target.direction === "at-least" ? "≥" : "≤"} {target.target === null ? "baseline first" : `${target.target}${target.unit === "percent" ? "%" : "h"}`}</p><p className="mt-4 text-xs font-bold uppercase tracking-wide text-leaf">Owner: {target.owner}</p></article>; })}</div><p className="mt-6 text-xs text-ink/45">Generated {new Date(snapshot.generatedAt).toLocaleString("en-UG")}</p></main>;
}
