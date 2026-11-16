import Link from "next/link";

import type { AdminSnapshot } from "@/lib/admin-data";
import { formatDate } from "@/lib/dates";
import type { CatalogueSummary } from "@/services/admin/catalogue-summary";
import { choiceLabel } from "@/services/profile/choices";

type Tone = "neutral" | "warn" | "alert" | "good";
const TONE: Record<Tone, string> = {
  neutral: "",
  good: "border-[#B7E4C7] bg-[#EFFAF2]",
  warn: "border-[#FBE7A1] bg-[#FFF8DC]",
  alert: "border-[rgba(220,38,38,.25)] bg-[rgba(220,38,38,.05)]",
};

function Stat({ label, value, note, tone = "neutral", href }: { label: string; value: number | string; note?: string; tone?: Tone; href?: string }): React.JSX.Element {
  const body = <>
    <h3 className="text-[13px] font-semibold text-navy">{label}</h3>
    <div>
      <p className="text-[1.875rem] font-extrabold leading-tight tracking-tight text-ink">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {note && <p className="text-xs text-navy">{note}</p>}
    </div>
  </>;
  const className = `stat-card ${TONE[tone]} ${href ? "transition hover:-translate-y-0.5" : ""}`;
  return href ? <Link href={href} className={className}>{body}</Link> : <section className={className}>{body}</section>;
}

function change(value: number | null | undefined, before: number | null | undefined): string {
  if (value == null || before == null) return "No earlier data";
  const diff = Number((value - before).toFixed(1));
  return `${diff >= 0 ? "+" : "−"}${Math.abs(diff).toLocaleString()} vs previous period`;
}

export interface OverviewProps {
  catalogue: CatalogueSummary;
  publishersAwaitingVerification: number;
  users: AdminSnapshot["headlines"];
  previousUsers: AdminSnapshot["headlines"] | null;
  periodDays: number;
}

/**
 * The admin landing page answers three questions, in this order: what needs me today, what is in the
 * catalogue (and what is about to leave it), and are people using it. Detailed analytics live on their own pages.
 */
export function AdminOverview({ catalogue: c, publishersAwaitingVerification, users: h, previousUsers: p, periodDays }: OverviewProps): React.JSX.Element {
  const completed = h.users ? Math.round(Number(h.completeProfiles ?? 0) / Number(h.users) * 100) : null;
  const completedBefore = p?.users ? Math.round(Number(p.completeProfiles ?? 0) / Number(p.users) * 100) : null;
  const largest = Math.max(1, ...c.liveByCategory.map((row) => row.count));
  const attention = [
    { label: "Listings awaiting review", value: c.awaitingReview, href: "/admin/review", tone: c.awaitingReview ? "warn" : "good", note: c.awaitingReview ? "Approve or reject in the review queue" : "Queue clear" },
    { label: "Reported by users", value: c.reported, href: "/admin/review?flag=reported", tone: c.reported ? "alert" : "good", note: c.reported ? "Check these first" : "Nothing reported" },
    { label: "Publishers to verify", value: publishersAwaitingVerification, href: "/admin/review?tab=organizations", tone: publishersAwaitingVerification ? "warn" : "good", note: "Organisations that signed up in the app" },
    { label: "Need a re-check soon", value: c.staleSoon, href: "/admin/fixes#recheck", tone: c.staleSoon ? "warn" : "good", note: c.staleSoon ? "Removed within 4 days unless re-confirmed" : "All recently checked" },
  ] as const;
  return <>
    <section aria-labelledby="attention" className="flex flex-col gap-3">
      <h2 id="attention" className="section-title">Needs your attention</h2>
      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">{attention.map((item) => <Stat key={item.label} {...item} />)}</div>
      {c.approvedButHidden > 0 && <Link href="/admin/fixes#hidden" className="block rounded-2xl border border-[rgba(220,38,38,.25)] bg-[rgba(220,38,38,.05)] p-4 text-sm text-ink transition hover:bg-[rgba(220,38,38,.09)]">
        <strong>{c.approvedButHidden} approved listing{c.approvedButHidden === 1 ? " is" : "s are"} hidden from seekers</strong>
        {c.approvedButHiddenReason ? `, mostly because: ${c.approvedButHiddenReason}.` : "."} <span className="font-bold underline">See the list and fix them →</span>
      </Link>}
    </section>

    <section aria-labelledby="catalogue" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="catalogue" className="section-title">Catalogue</h2>
        <Link href="/admin/opportunities" className="text-[13px] font-bold text-navy hover:text-ink">All listings →</Link>
      </div>
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3 xl:grid-cols-5">
        <Stat label="Live for seekers" value={c.live} note={c.rolling ? `${c.rolling} rolling, no closing date` : "Visible in feeds now"} tone={c.live ? "neutral" : "alert"} />
        <Stat label="Closing in 3 days" value={c.closingIn3Days} note="Drop off automatically" tone={c.closingIn3Days ? "warn" : "neutral"} />
        <Stat label="Closing in 7 days" value={c.closingIn7Days} note="Including the 3-day group" />
        <Stat label="Approved, last 7 days" value={c.approvedLast7Days} note="Added to the catalogue" tone="good" />
        <Stat label="Expired, last 7 days" value={c.expiredLast7Days} note="Deadline passed, removed" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="surface" aria-labelledby="by-type">
          <h3 id="by-type" className="surface-title">Live listings by type</h3>
          {c.liveByCategory.length ? <dl className="mt-4 flex flex-col gap-3">{c.liveByCategory.map((row) => <div key={row.category} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
            <dt className="text-[13px] font-semibold text-ink">{choiceLabel(row.category)}</dt>
            <dd className="h-3 overflow-hidden rounded-full bg-ink/[.06]"><span className="block h-full rounded-full bg-gradient-to-r from-[#FFE27A] to-[#FFC700]" style={{ width: `${Math.round(row.count / largest * 100)}%` }} /></dd>
            <dd className="text-right text-[13px] font-bold text-ink">{row.count}</dd>
          </div>)}</dl> : <p className="mt-3 text-sm text-navy">No live listings. Approve listings in the review queue.</p>}
        </section>
        <section className="surface" aria-labelledby="closing-soon">
          <h3 id="closing-soon" className="surface-title">Closing next</h3>
          {c.closingSoon.length ? <ul className="mt-3">{c.closingSoon.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 border-t border-ink/[.07] py-2.5 first:border-t-0">
            <div className="min-w-0">
              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="block truncate text-[13px] font-bold text-ink hover:underline">{item.title}</a>
              <span className="block truncate text-xs text-navy">{item.organization} · {choiceLabel(item.category)}</span>
            </div>
            <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${item.daysLeft <= 3 ? "bg-[rgba(220,38,38,.08)] text-[#9B1C1C]" : "bg-[#FFF3C4] text-[#6B4E00]"}`}>
              {item.daysLeft <= 1 ? "Closes today" : `${item.daysLeft} days`} · {formatDate(item.deadline, { day: "numeric", month: "short" })}
            </span>
          </li>)}</ul> : <p className="mt-3 text-sm text-navy">No fixed deadlines in the live catalogue.</p>}
        </section>
      </div>
    </section>

    <section aria-labelledby="people" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="people" className="section-title">People, last {periodDays} days</h2>
        <Link href="/admin/users" className="text-[13px] font-bold text-navy hover:text-ink">Users →</Link>
      </div>
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3 xl:grid-cols-5">
        <Stat label="Total users" value={Number(h.users ?? 0)} note={change(h.users, p?.users)} />
        <Stat label="New users" value={Number(h.newUsers ?? 0)} note={change(h.newUsers, p?.newUsers)} />
        <Stat label="Active users" value={Number(h.activeUsers ?? 0)} note={change(h.activeUsers, p?.activeUsers)} />
        <Stat label="Completed profiles" value={completed == null ? "—" : `${completed}%`} note={change(completed, completedBefore)} />
        <Stat label="Saves and apply clicks" value={Number(h.saves ?? 0) + Number(h.applyIntents ?? 0)} note={`${Number(h.saves ?? 0).toLocaleString()} saves · ${Number(h.applyIntents ?? 0).toLocaleString()} apply clicks`} />
      </div>
    </section>
  </>;
}
