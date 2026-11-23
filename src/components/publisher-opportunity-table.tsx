"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Icon } from "@/components/app-shell";
import type { Opportunity } from "@/core/entities/domain";
import { formatDate } from "@/lib/dates";
import { choiceLabel } from "@/services/profile/choices";

type ListingFilter = "All" | "Published" | "In review" | "Changes requested" | "Closed";

const filters: ListingFilter[] = ["All", "Published", "In review", "Changes requested", "Closed"];

function listingStatus(opportunity: Opportunity, now = new Date()): Exclude<ListingFilter, "All"> {
  if (opportunity.verificationStatus === "flagged") return "Changes requested";
  if (["closed", "stale", "removed"].includes(opportunity.status) || opportunity.verificationStatus === "unverified") return "Closed";
  // A listing whose closing date has passed is no longer shown to anyone, whatever its review state.
  if (opportunity.deadline && new Date(opportunity.deadline) <= now) return "Closed";
  if (opportunity.verificationStatus === "pending") return "In review";
  return "Published";
}

const statusStyles: Record<Exclude<ListingFilter, "All">, string> = {
  Published: "bg-[rgba(31,126,110,0.1)] text-[#145347]",
  "In review": "bg-[#FFF3C4] text-[#6B4E00]",
  "Changes requested": "bg-[rgba(220,38,38,0.08)] text-[#9B1C1C]",
  Closed: "bg-[rgba(30,41,59,0.06)] text-[#3F4D62]",
};

const statusDots: Record<Exclude<ListingFilter, "All">, string> = {
  Published: "bg-[#1F7E6E]",
  "In review": "bg-[#8A6400]",
  "Changes requested": "bg-[#DC2626]",
  Closed: "bg-[#3F4D62]",
};

function StatusPill({ status }: { status: Exclude<ListingFilter, "All"> }): React.JSX.Element {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[status]}`}>
      <span className={`size-1.5 rounded-full ${statusDots[status]}`} aria-hidden="true" />
      {status}
    </span>
  );
}

export function PublisherOpportunityTable({
  opportunities,
  title,
  action,
  filterable = false,
  emptyText = "No opportunities match this status.",
}: {
  opportunities: Opportunity[];
  title: string;
  action?: { href: string; label: string };
  filterable?: boolean;
  /** Shown when there is nothing to list (before any filter is applied, or when a filter matches nothing). */
  emptyText?: string;
}): React.JSX.Element {
  const [filter, setFilter] = useState<ListingFilter>("All");
  const filteredOpportunities = useMemo(
    () => filter === "All" ? opportunities : opportunities.filter((item) => listingStatus(item) === filter),
    [filter, opportunities],
  );

  return (
    <>
      {filterable && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">{filteredOpportunities.length} postings</h2>
          <div className="flex flex-wrap gap-2" aria-label="Filter opportunities by status">
            {filters.map((item) => (
              <button key={item} type="button" className="chip" aria-pressed={filter === item} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      <section className="surface" aria-label={title}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="surface-title">{title}</h2>
          {action && <Link className="text-[13px] font-bold text-[#6B4E00] underline-offset-4 hover:underline" href={action.href}>{action.label}</Link>}
        </div>
        {filteredOpportunities.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-y border-ink/[.07] text-xs font-bold uppercase tracking-[.06em] text-[#5B6A80]">
                  <th scope="col" className="px-3 py-3">Opportunity</th>
                  <th scope="col" className="px-3 py-3">Type</th>
                  <th scope="col" className="px-3 py-3">Status</th>
                  <th scope="col" className="px-3 py-3">Closes</th>
                  <th scope="col" className="px-3 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[.07] text-sm">
                {filteredOpportunities.map((item) => (
                  <tr key={item.id}>
                    <th scope="row" className="max-w-[280px] px-3 py-3.5 text-left font-bold text-ink">{item.title}</th>
                    <td className="px-3 py-3.5"><span className="cat-pill">{choiceLabel(item.category)}</span></td>
                    <td className="px-3 py-3.5"><StatusPill status={listingStatus(item)} /></td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-navy">
                      {item.deadline
                        ? formatDate(item.deadline, { day: "2-digit", month: "short", year: "numeric" })
                        : "Open until filled"}
                    </td>
                    <td className="px-3 py-3.5">
                      <Link className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap text-[13px] font-bold text-[#6B4E00]" href={`/dashboard/${item.id}/edit`}>
                        <Icon name="edit" size={14} />Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-navy">{opportunities.length ? "No opportunities match this status." : emptyText}</p>
        )}
      </section>
    </>
  );
}
