import { AdminHeader } from "@/components/admin-header";
import { CatalogueFixActions } from "@/components/catalogue-fix-actions";
import { requireAdminPortal } from "@/lib/admin-portal";
import { formatDate } from "@/lib/dates";
import { getRepository } from "@/lib/repository";
import { hiddenApprovedListings, recheckDueListings, type FixableListing } from "@/services/admin/catalogue-fixes";
import { choiceLabel } from "@/services/profile/choices";

export const dynamic = "force-dynamic";

const th = "px-4 pb-3 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#5B6A80]";
const td = "border-t border-ink/[.07] px-4 py-3 align-top text-[13px] text-ink";

function Rows({ items, showReasons }: { items: FixableListing[]; showReasons: boolean }): React.JSX.Element {
  return <div className="overflow-x-auto"><table className="w-full min-w-[820px] table-fixed border-collapse">
    <colgroup><col className="w-[32%]" /><col className="w-[12%]" /><col className="w-[13%]" /><col className="w-[18%]" /><col className="w-[25%]" /></colgroup>
    <thead><tr><th scope="col" className={th}>Listing</th><th scope="col" className={th}>Type</th><th scope="col" className={th}>Closes</th><th scope="col" className={th}>{showReasons ? "Why it is hidden" : "Last checked"}</th><th scope="col" className={th}>Fix</th></tr></thead>
    <tbody>{items.map(({ opportunity, reasons, actions, daysSinceCheck }) => <tr key={opportunity.id}>
      <td className={td}>
        <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer" className="block truncate font-bold hover:underline">{opportunity.title}</a>
        <span className="block truncate text-xs text-navy">{opportunity.organization?.name ?? opportunity.organizationName ?? "No provider"}</span>
      </td>
      <td className={td}><span className="cat-pill">{choiceLabel(opportunity.category)}</span></td>
      <td className={td}>{opportunity.deadline ? formatDate(opportunity.deadline, { day: "numeric", month: "short" }) : "Rolling"}</td>
      <td className={td}>{showReasons ? <ul className="list-disc pl-4 text-xs leading-5">{reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : `${daysSinceCheck} days ago`}</td>
      <td className={td}>{actions.length ? <CatalogueFixActions id={opportunity.id} actions={actions} /> : <span className="text-xs text-navy">Fix from the review queue</span>}</td>
    </tr>)}</tbody>
  </table></div>;
}

/** Everything the catalogue owner needs to repair: approved listings seekers cannot see, and live ones about to expire unchecked. */
export default async function CatalogueFixesPage(): Promise<React.JSX.Element> {
  await requireAdminPortal();
  const now = new Date();
  const opportunities = await (await getRepository()).listOpportunities();
  const hidden = hiddenApprovedListings(opportunities, now);
  const due = recheckDueListings(opportunities, now);
  return <main className="animate-in flex min-w-0 flex-col gap-6">
    <AdminHeader title="Catalogue fixes" subtitle="Approved listings seekers cannot see, and live listings that need a re-check before they drop off." />

    <section id="hidden" className="surface" aria-labelledby="hidden-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="hidden-title" className="surface-title">Approved but hidden · {hidden.length}</h2>
          <p className="mt-1 text-sm text-navy">These passed review but are not shown to seekers. Hover a button to see what it does.</p>
        </div>
      </div>
      {hidden.length ? <Rows items={hidden} showReasons /> : <p className="text-sm text-navy">Every approved, open listing is visible to seekers.</p>}
    </section>

    <section id="recheck" className="surface" aria-labelledby="recheck-title">
      <div className="mb-4">
        <h2 id="recheck-title" className="surface-title">Re-check due · {due.length}</h2>
        <p className="mt-1 text-sm text-navy">Live listings not confirmed for a while. Open each source; if it is still open, press &ldquo;I re-checked it today&rdquo;. Otherwise remove it. Unchecked listings are removed automatically after 14 days.</p>
      </div>
      {due.length ? <Rows items={due} showReasons={false} /> : <p className="text-sm text-navy">Nothing is close to the 14-day limit.</p>}
    </section>
  </main>;
}
