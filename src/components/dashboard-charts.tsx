import type { KpiMetric } from "@/services/kpi/dashboard";
import type { SloTarget } from "@/config/slo-targets";

export function InterestFunnel({ items }: { items: ReadonlyArray<readonly [string, number]> }): React.JSX.Element {
  const maximum = Math.max(1, ...items.map(([, value]) => value));
  const colors = ["text-sun", "text-leaf", "text-coral", "text-ink"];
  return <figure className="card mt-6">
    <figcaption><h2 className="text-xl font-black">From discovery to a next step</h2><p className="mt-2 text-sm text-ink/60">Actions across your listings, on one scale. These are event totals, not unique people or a tracked cohort.</p></figcaption>
    <div className="mt-6 space-y-5">{items.map(([label, value], index) => <div key={label}>
      <div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-bold">{label}</span><span className="tabular-nums">{value}</span></div>
      <svg viewBox="0 0 600 20" className={`h-5 w-full ${colors[index]}`} preserveAspectRatio="none" role="img" aria-label={`${label}: ${value} events`}>
        <rect width="600" height="20" rx="10" className="fill-ink/5" />
        <rect width={value / maximum * 600} height="20" rx="10" fill="currentColor" />
      </svg>
    </div>)}</div>
    {items.every(([, value]) => value === 0) && <p className="mt-5 rounded-2xl border border-dashed border-ink/20 p-4 text-sm text-ink/60">Ready for your first visitor. Views, saves, and source visits will appear here as people explore your listings.</p>}
  </figure>;
}

// Stable seven-point examples, ending at the actual current value. Never stored as history.
function illustrativeSeries(metric: KpiMetric): number[] {
  const seed = [...metric.key].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 17);
  const direction = seed % 3 === 0 ? -1 : 1;
  return Array.from({ length: 7 }, (_, index) => {
    const offset = (6 - index) / 6;
    const variation = index === 6 ? 0 : ((seed >>> (index * 3)) % 7 - 3) / 100;
    const value = Math.max(0, metric.value * (1 - direction * offset * 0.28 + variation));
    return metric.unit === "percent" ? Math.min(Math.max(100, metric.value), value) : value;
  });
}

export function KpiTrend({ metric, periodDays, illustrative }: { metric: KpiMetric; periodDays: number; illustrative: boolean }): React.JSX.Element {
  if (!illustrative) return <p className="mt-5 rounded-xl border border-dashed border-ink/15 p-3 text-xs text-ink/55">Trend history is not available yet.</p>;
  const series = illustrativeSeries(metric);
  const delta = series[6] - series[0];
  const waiting = metric.sampleSize === 0;
  const tone = waiting ? "text-ink/40" : delta > 0.01 ? "text-leaf" : delta < -0.01 ? "text-coral" : "text-ink/65";
  const dot = waiting ? "bg-ink/20" : delta > 0.01 ? "bg-leaf" : delta < -0.01 ? "bg-coral" : "bg-sun";
  const label = waiting ? "Collecting data" : delta > 0.01 ? "Improving illustration" : delta < -0.01 ? "Declining illustration" : "Steady illustration";
  const maximum = Math.max(1, ...series) * 1.12;
  return <figure className={`mt-5 ${tone}`}>
    <svg viewBox="0 0 280 64" className="h-16 w-full" preserveAspectRatio="none" role="img" aria-label={`Illustrative seven-point trend for ${metric.label}, ending at ${metric.value}. Not observed history.`}>
      <path d="M0 63 H280" className="stroke-ink/10" />
      {series.map((value, index) => <rect key={index} x={index * 40 + 5} y={63 - value / maximum * 60} width="26" height={Math.max(1, value / maximum * 60)} rx="4" fill="currentColor" opacity={index === 6 ? 1 : 0.3 + index * 0.08} />)}
    </svg>
    <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-2 font-bold"><span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />{label}</span>
      <span className="text-ink/50">Illustrative · {periodDays} days</span>
    </figcaption>
  </figure>;
}

export function sloStatus(value: number | null, target: SloTarget): "Met" | "At risk" | "Collecting data" | "Baseline first" {
  if (value === null) return "Collecting data";
  if (target.target === null) return "Baseline first";
  return (target.direction === "at-least" ? value >= target.target : value <= target.target) ? "Met" : "At risk";
}

export function SloGauge({ value, target }: { value: number | null; target: SloTarget }): React.JSX.Element {
  const maximum = target.unit === "percent" ? Math.max(100, value ?? 0) : Math.max(60, (value ?? 0) * 1.15, (target.target ?? 0) * 1.25);
  return <svg viewBox="0 0 300 28" className="mt-5 h-7 w-full" role="img" aria-label={value === null ? `${target.metric}: collecting data` : `${target.metric}: ${value} ${target.unit}; target ${target.target ?? "not set"}`}>
    <path d="M2 14 H298" className="stroke-ink/10" strokeWidth="10" strokeLinecap="round" strokeDasharray={value === null ? "3 9" : undefined} />
    {value !== null && <rect x="2" y="9" width={Math.max(0, value / maximum * 296)} height="10" rx="5" fill="currentColor" />}
    {target.target !== null && <path d={`M${2 + target.target / maximum * 296} 3 v22`} className="stroke-ink/70" strokeWidth="2" />}
  </svg>;
}
