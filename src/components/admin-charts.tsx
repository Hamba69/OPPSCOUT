"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AggregatePoint } from "@/lib/admin-data";

export type ChartKind = "line" | "area" | "bar" | "horizontal" | "histogram" | "donut" | "funnel" | "sparkline";

const PALETTE = ["#1F7E6E", "#F6C94C", "#F28C7A", "#3F4D62", "#8E6BBF", "#4BA3C7", "#9B8A61"];
const MAX_SLICES = 7;
const HEIGHT = 230;
const M = { top: 14, right: 12, bottom: 30, left: 44 };

const num = (v: number): string => Number(v.toFixed(2)).toLocaleString();
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function unitOf(title: string): string {
  const t = title.toLowerCase();
  return t.includes("percent") ? "%" : t.includes("millisecond") ? " ms" : "";
}
function niceLabel(label: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(label);
  return m ? `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${Number(m[3])}` : label;
}
function niceMax(value: number): { max: number; ticks: number[] } {
  const raw = value > 0 ? value : 1, target = raw / 4, pow = 10 ** Math.floor(Math.log10(target)), f = target / pow;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
  const count = Math.ceil(raw / step - 1e-9);
  return { max: count * step, ticks: Array.from({ length: count + 1 }, (_, i) => i * step) };
}
function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    setWidth(el.clientWidth || 560);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.floor(entry!.contentRect.width))));
    observer.observe(el); return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function Tooltip({ x, y, width, title, value, extra }: { x: number; y: number; width: number; title: string; value: string; extra?: string }): React.JSX.Element {
  const flip = x > width * 0.6;
  return <div role="status" className="pointer-events-none absolute z-10 min-w-24 max-w-52 rounded-xl bg-ink px-3 py-2 text-xs text-cream shadow-soft" style={{ left: x, top: Math.max(0, y - 8), transform: `translate(${flip ? "calc(-100% - 12px)" : "12px"}, -100%)` }}>
    <p className="font-semibold opacity-80">{title}</p><p className="text-base font-extrabold tabular-nums">{value}</p>{extra && <p className="opacity-70">{extra}</p>}
  </div>;
}

/** Time series: line, area, sparkline. Hover, touch or arrow keys move a crosshair across the points. */
function LineChart({ data, kind, unit, yLabel }: { data: AggregatePoint[]; kind: ChartKind; unit: string; yLabel: string }): React.JSX.Element {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const { max, ticks } = niceMax(Math.max(...data.map((p) => p.value)));
  const iw = width - M.left - M.right, ih = HEIGHT - M.top - M.bottom;
  const x = (i: number): number => M.left + (data.length === 1 ? iw / 2 : i * iw / (data.length - 1));
  const y = (v: number): number => M.top + ih - v / max * ih;
  const path = data.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 64))));
  const peak = data.reduce((best, p, i) => p.value > data[best]!.value ? i : best, 0);
  const move = (clientX: number, el: Element): void => {
    const rect = el.getBoundingClientRect(), pos = clientX - rect.left - M.left;
    setHover(Math.min(data.length - 1, Math.max(0, Math.round(data.length === 1 ? 0 : pos / iw * (data.length - 1)))));
  };
  return <div ref={ref} className="relative">
    <svg width={width} height={HEIGHT} role="img" tabIndex={0} aria-label={`Line chart, ${data.length} points. Use left and right arrow keys to read each value.`} className="block touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-leaf/40 rounded-xl text-leaf"
      onPointerMove={(e) => move(e.clientX, e.currentTarget)} onPointerDown={(e) => move(e.clientX, e.currentTarget)} onPointerLeave={() => setHover(null)} onBlur={() => setHover(null)}
      onKeyDown={(e) => { if (e.key === "ArrowRight") setHover((h) => Math.min(data.length - 1, (h ?? -1) + 1)); else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? data.length) - 1)); else if (e.key === "Escape") setHover(null); }}>
      {ticks.map((t) => <g key={t}><line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} className="stroke-ink/10" strokeDasharray={t ? "3 4" : undefined} /><text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="fill-navy text-[11px]">{num(t)}</text></g>)}
      <text x={4} y={M.top - 4} className="fill-navy text-[11px] font-semibold">{yLabel}</text>
      {data.map((p, i) => i % every === 0 && <text key={p.label + i} x={x(i)} y={HEIGHT - 8} textAnchor="middle" className="fill-navy text-[11px]">{niceLabel(p.label)}</text>)}
      {kind === "area" && <path d={`${path} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill="currentColor" opacity=".14" />}
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.length <= 40 && data.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.value)} r={hover === i ? 5.5 : 3} fill="currentColor" stroke="#fff" strokeWidth="1.5" />)}
      {data.length > 40 && hover === null && <circle cx={x(peak)} cy={y(data[peak]!.value)} r="4" fill="currentColor" stroke="#fff" strokeWidth="1.5" />}
      {hover !== null && <><line x1={x(hover)} x2={x(hover)} y1={M.top} y2={y(0)} className="stroke-ink/40" strokeDasharray="4 3" /><circle cx={x(hover)} cy={y(data[hover]!.value)} r="6" fill="currentColor" stroke="#fff" strokeWidth="2" /></>}
    </svg>
    {hover !== null && <Tooltip x={x(hover)} y={y(data[hover]!.value)} width={width} title={niceLabel(data[hover]!.label)} value={`${num(data[hover]!.value)}${unit}`} extra={data[hover]!.samples != null ? `${num(data[hover]!.samples!)} samples` : undefined} />}
  </div>;
}

/** Vertical columns: bar and histogram. */
function ColumnChart({ data, unit, yLabel, histogram }: { data: AggregatePoint[]; unit: string; yLabel: string; histogram: boolean }): React.JSX.Element {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const { max, ticks } = niceMax(Math.max(...data.map((p) => p.value)));
  const iw = width - M.left - M.right, ih = HEIGHT - M.top - M.bottom;
  const slot = iw / data.length, bw = Math.max(2, slot * (histogram ? 0.92 : 0.7));
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 56))));
  const total = data.reduce((n, p) => n + p.value, 0);
  const showValues = data.length <= 12 && slot > 34;
  return <div ref={ref} className="relative">
    <svg width={width} height={HEIGHT} role="img" aria-label={`Bar chart, ${data.length} bars. Values are listed in the table below.`} className="block touch-pan-y select-none" onPointerLeave={() => setHover(null)}>
      {ticks.map((t) => <g key={t}><line x1={M.left} x2={width - M.right} y1={M.top + ih - t / max * ih} y2={M.top + ih - t / max * ih} className="stroke-ink/10" strokeDasharray={t ? "3 4" : undefined} /><text x={M.left - 8} y={M.top + ih - t / max * ih + 4} textAnchor="end" className="fill-navy text-[11px]">{num(t)}</text></g>)}
      <text x={4} y={M.top - 4} className="fill-navy text-[11px] font-semibold">{yLabel}</text>
      {data.map((p, i) => {
        const h = p.value / max * ih, cx = M.left + slot * i + slot / 2, active = hover === i;
        return <g key={p.label + i} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)}>
          <rect x={M.left + slot * i} y={M.top} width={slot} height={ih} fill="transparent" />
          <rect x={cx - bw / 2} y={M.top + ih - h} width={bw} height={Math.max(p.value > 0 ? 2 : 0, h)} rx={histogram ? 2 : 4} fill={PALETTE[0]} opacity={hover === null || active ? 1 : 0.45} />
          {showValues && <text x={cx} y={M.top + ih - h - 5} textAnchor="middle" className="fill-ink text-[11px] font-bold">{num(p.value)}</text>}
          {i % every === 0 && <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="fill-navy text-[11px]">{niceLabel(p.label).slice(0, 12)}</text>}
        </g>;
      })}
    </svg>
    {hover !== null && <Tooltip x={M.left + slot * hover + slot / 2} y={M.top + ih - data[hover]!.value / max * ih} width={width} title={data[hover]!.label} value={`${num(data[hover]!.value)}${unit}`} extra={total && !unit ? `${num(data[hover]!.value / total * 100)}% of total` : undefined} />}
  </div>;
}

/** Ranked list: labels on the left, value on the right, so long names stay readable. */
function RankedBars({ data, unit }: { data: AggregatePoint[]; unit: string }): React.JSX.Element {
  const [all, setAll] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const sorted = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
  const shown = all ? sorted : sorted.slice(0, 10), max = Math.max(1, sorted[0]?.value ?? 1), total = data.reduce((n, p) => n + p.value, 0);
  return <div>
    <ul className="space-y-1.5">{shown.map((p, i) => <li key={p.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} className={`grid grid-cols-[minmax(5rem,9rem)_1fr_auto] items-center gap-2 rounded-lg px-1.5 py-1 text-sm transition sm:grid-cols-[minmax(6rem,12rem)_1fr_auto] ${hover === i ? "bg-butter" : ""}`}>
      <span className="truncate font-medium text-ink" title={p.label}>{p.label}</span>
      <span className="h-5 rounded-md bg-ink/5"><span className="block h-full rounded-md bg-leaf transition-[width]" style={{ width: `${Math.max(p.value > 0 ? 1.5 : 0, p.value / max * 100)}%` }} /></span>
      <span className="min-w-14 text-right tabular-nums"><strong>{num(p.value)}{unit}</strong>{!unit && total > 0 && <span className="ml-1 hidden text-xs text-navy sm:inline">{num(p.value / total * 100)}%</span>}</span>
    </li>)}</ul>
    {sorted.length > 10 && <button type="button" className="mt-2 min-h-9 text-xs font-semibold text-leaf underline" onClick={() => setAll((v) => !v)}>{all ? "Show top 10" : `Show all ${sorted.length}`}</button>}
  </div>;
}

/** Donut with a legend that doubles as the labels; hover either to highlight a slice. */
function Donut({ data, unit }: { data: AggregatePoint[]; unit: string }): React.JSX.Element {
  const [hover, setHover] = useState<number | null>(null);
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const slices = sorted.length > MAX_SLICES ? [...sorted.slice(0, MAX_SLICES - 1), { ...sorted[0]!, label: "Other", value: sorted.slice(MAX_SLICES - 1).reduce((n, p) => n + p.value, 0) }] : sorted;
  const total = slices.reduce((n, p) => n + p.value, 0);
  const starts = slices.map((_, i) => slices.slice(0, i).reduce((n, p) => n + (total ? p.value / total * 100 : 0), 0));
  const center = hover === null ? { top: num(total) + unit, bottom: "total" } : { top: `${total ? num(slices[hover]!.value / total * 100) : 0}%`, bottom: slices[hover]!.label };
  return <div className="flex flex-col items-center gap-5 sm:flex-row">
    <svg viewBox="0 0 160 160" className="size-44 shrink-0" role="img" aria-label={`Donut chart of ${slices.length} categories, total ${num(total)}. Values are listed beside it.`} onPointerLeave={() => setHover(null)}>
      {slices.map((p, i) => { const len = total ? p.value / total * 100 : 0, o = starts[i]!;
        return <circle key={p.label} cx="80" cy="80" r="56" pathLength="100" fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth={hover === i ? 28 : 22} strokeDasharray={`${Math.max(0, len - 0.6)} ${100 - Math.max(0, len - 0.6)}`} strokeDashoffset={-o} transform="rotate(-90 80 80)" opacity={hover === null || hover === i ? 1 : 0.35} className="cursor-pointer transition-all" onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} />; })}
      <text x="80" y="80" textAnchor="middle" className="fill-ink text-[20px] font-extrabold">{center.top}</text>
      <text x="80" y="98" textAnchor="middle" className="fill-navy text-[10px]">{center.bottom.slice(0, 18)}</text>
    </svg>
    <ul className="w-full min-w-0 flex-1 space-y-1 text-sm">{slices.map((p, i) => <li key={p.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} className={`flex items-center gap-2 rounded-lg px-2 py-1 ${hover === i ? "bg-butter" : ""}`}>
      <span className="size-3 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate font-medium text-ink" title={p.label}>{p.label}</span>
      <span className="tabular-nums"><strong>{num(p.value)}{unit}</strong><span className="ml-1 text-xs text-navy">{total ? num(p.value / total * 100) : 0}%</span></span>
    </li>)}</ul>
  </div>;
}

/** Funnel: each step shows its count, its share of the first step, and the drop from the step before. */
function Funnel({ data }: { data: AggregatePoint[] }): React.JSX.Element {
  const [hover, setHover] = useState<number | null>(null);
  const first = Math.max(1, data[0]?.value ?? 1), max = Math.max(1, ...data.map((p) => p.value));
  return <ol className="space-y-3">{data.map((p, i) => { const prev = i ? data[i - 1]!.value : null;
    return <li key={p.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} className={`rounded-xl p-2 transition ${hover === i ? "bg-butter" : ""}`}>
      <div className="flex items-baseline justify-between gap-3 text-sm"><span className="font-bold text-ink">{i + 1}. {p.label}</span><span className="tabular-nums"><strong>{num(p.value)}</strong><span className="ml-1 text-xs text-navy">{num(p.value / first * 100)}% of first step</span></span></div>
      <div className="mt-1.5 h-7 rounded-lg bg-ink/5"><div className="mx-auto h-full rounded-lg transition-[width]" style={{ width: `${Math.max(p.value > 0 ? 2 : 0, p.value / max * 100)}%`, background: PALETTE[i % PALETTE.length] }} /></div>
      {prev != null && <p className="mt-1 text-xs text-navy">{prev > 0 ? `${num(p.value / prev * 100)}% of the previous step continued · ${num(Math.max(0, prev - p.value))} dropped off` : "No one reached the previous step"}</p>}
    </li>; })}</ol>;
}

function describe(kind: ChartKind, data: AggregatePoint[], unit: string): string {
  const total = data.reduce((n, p) => n + p.value, 0);
  const top = data.reduce((b, p) => p.value > b.value ? p : b, data[0]!);
  if (["line", "area", "sparkline"].includes(kind)) return `Latest ${num(data.at(-1)!.value)}${unit} · Peak ${num(top.value)}${unit} on ${niceLabel(top.label)}${unit ? "" : ` · Total ${num(total)}`}. Hover, tap, or use arrow keys to read a point.`;
  if (kind === "funnel") return "Each step shows how many continued from the step before.";
  if (kind === "donut" || kind === "horizontal") return `${data.length} categories${unit ? "" : ` · Total ${num(total)}`} · Largest: ${top.label} (${num(top.value)}${unit}).`;
  return `${data.length} bars${unit ? "" : ` · Total ${num(total)}`} · Highest: ${niceLabel(top.label)} (${num(top.value)}${unit}). Hover or tap a bar for its value.`;
}

export function AdminChart({ title, points, kind = "bar" }: { title: string; points: AggregatePoint[]; kind?: ChartKind }): React.JSX.Element {
  const data = points.slice(0, 90), unit = unitOf(title);
  const yLabel = unit === "%" ? "Percent" : unit ? "Milliseconds" : "Count";
  const extraCols = (["samples", "p50", "p95", "p99"] as const).filter((k) => data.some((p) => p[k] != null));
  return <figure className="card min-w-0">
    <figcaption className="mb-1 font-extrabold text-ink">{title}</figcaption>
    {!data.length ? <p className="rounded-xl bg-butter p-4 text-sm text-navy">No data yet for this period.</p> : <>
      <p className="mb-3 text-xs leading-5 text-navy">{describe(kind, data, unit)}</p>
      {["line", "area", "sparkline"].includes(kind) ? <LineChart data={data} kind={kind} unit={unit} yLabel={yLabel} />
        : kind === "donut" ? <Donut data={data} unit={unit} />
        : kind === "funnel" ? <Funnel data={data} />
        : kind === "horizontal" ? <RankedBars data={data} unit={unit} />
        : <ColumnChart data={data} unit={unit} yLabel={yLabel} histogram={kind === "histogram"} />}
      <details className="mt-3 text-xs text-navy"><summary className="min-h-8 cursor-pointer font-semibold">View as table</summary><div className="max-h-64 overflow-auto"><table className="w-full text-left"><thead><tr><th>Category</th><th>Value</th>{extraCols.map((k) => <th key={k}>{k === "samples" ? "Samples" : k}</th>)}</tr></thead><tbody>{data.map((p) => <tr key={p.label}><th className="py-1 pr-2 font-medium">{p.label}</th><td className="pr-2">{num(p.value)}{unit}</td>{extraCols.map((k) => <td key={k} className="pr-2">{p[k] == null ? "—" : num(p[k]!)}</td>)}</tr>)}</tbody></table></div></details>
    </>}
  </figure>;
}
