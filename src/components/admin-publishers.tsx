import Link from "next/link";

import type { Opportunity, Organization } from "@/core/entities/domain";
import { formatDate } from "@/lib/dates";
import { isPublisherOrganization } from "@/services/admin/catalogue-summary";

const th = "px-4 pb-3 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#5B6A80]";
const td = "border-t border-ink/[.07] px-4 py-3.5 align-middle text-[13px] text-ink";
const STATUS_TONE: Record<string, string> = {
  verified: "bg-[#EFFAF2] text-[#14532D]",
  pending: "bg-[#FFF3C4] text-[#6B4E00]",
  flagged: "bg-[rgba(220,38,38,.08)] text-[#9B1C1C]",
  unverified: "bg-ink/[.06] text-navy",
};

/**
 * Organisations that signed up through the app to post their own listings. Providers created by
 * seeding are not publishers: they need no verification and are not listed here.
 */
export function AdminPublishers({ organizations, opportunities, now = new Date() }: { organizations: Organization[]; opportunities: Opportunity[]; now?: Date }): React.JSX.Element {
  const publishers = organizations.filter(isPublisherOrganization).sort((a, b) => {
    const rank = (o: Organization) => (o.verificationStatus === "pending" ? 0 : o.verificationStatus === "flagged" ? 1 : 2);
    return rank(a) - rank(b) || b.createdAt.getTime() - a.createdAt.getTime();
  });
  const listings = new Map<string, { total: number; live: number }>();
  for (const opportunity of opportunities) {
    if ((opportunity.origin ?? "catalog") !== "organization" || !opportunity.organizationId) continue;
    const entry = listings.get(opportunity.organizationId) ?? { total: 0, live: 0 };
    entry.total += 1;
    if (opportunity.verificationStatus === "verified" && opportunity.deadline !== null && opportunity.deadline > now && opportunity.status !== "removed") entry.live += 1;
    listings.set(opportunity.organizationId, entry);
  }
  const count = (status: string) => publishers.filter((o) => o.verificationStatus === status).length;
  return <>
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {([["Publishers", publishers.length], ["Verified", count("verified")], ["Awaiting verification", count("pending")], ["Flagged", count("flagged")]] as const).map(([label, value]) =>
        <section key={label} className="stat-card"><h2 className="text-[13px] font-semibold text-navy">{label}</h2><p className="text-[1.875rem] font-extrabold leading-tight text-ink">{value}</p></section>)}
    </div>
    <section className="surface" aria-labelledby="publishers">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="publishers" className="surface-title">Organisations posting through the app</h2>
        {count("pending") > 0 && <Link href="/admin/review?tab=organizations" className="button !min-h-10 !px-5">Verify {count("pending")} waiting</Link>}
      </div>
      {publishers.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] table-fixed border-collapse">
        <colgroup><col className="w-[34%]" /><col className="w-[16%]" /><col className="w-[18%]" /><col className="w-[16%]" /><col className="w-[16%]" /></colgroup>
        <thead><tr><th scope="col" className={th}>Organisation</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Listings (live / all)</th><th scope="col" className={th}>Joined</th><th scope="col" className={th}><span className="sr-only">Action</span></th></tr></thead>
        <tbody>{publishers.map((organization) => {
          const stats = listings.get(organization.id) ?? { total: 0, live: 0 };
          return <tr key={organization.id}>
            <td className={td}><strong className="block truncate font-bold">{organization.name}</strong><span className="block truncate text-xs text-navy">{organization.officialEmail ?? organization.officialLinks[0] ?? "No official contact"}</span></td>
            <td className={td}><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_TONE[organization.verificationStatus] ?? STATUS_TONE.unverified}`}>{organization.verificationStatus}</span></td>
            <td className={td}>{stats.live} / {stats.total}</td>
            <td className={td}>{formatDate(organization.createdAt, { day: "numeric", month: "short", year: "numeric" })}</td>
            <td className={td}>{organization.verificationStatus !== "verified" && <Link href={`/admin/review?tab=organizations&review=${organization.id}`} className="button-secondary !min-h-10 !px-4">Review</Link>}</td>
          </tr>;
        })}</tbody>
      </table></div> : <p className="text-sm text-navy">No organisation has signed up to post yet. Listings added by seeding name their provider but do not need publisher verification.</p>}
    </section>
  </>;
}
