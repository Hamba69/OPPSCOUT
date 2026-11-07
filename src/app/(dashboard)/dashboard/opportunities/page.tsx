import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";

export const dynamic = "force-dynamic";

export default async function ProviderOpportunitiesPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const opportunities = await (await getRepository()).listOpportunities({
    organizationId: auth.organizationId ?? undefined,
    origin: "organization",
    statuses: ["open", "closing_soon"],
  });
  const publishedCount = opportunities.filter((item) => isUserVisibleOpportunity(item)).length;
  const reviewCount = opportunities.filter((item) => item.verificationStatus === "pending").length;

  return (
    <main className="page-shell animate-in">
      <header className="page-header">
        <div>
          <p className="eyebrow">Publisher workspace</p>
          <h1 className="!text-left !font-extrabold">Your active opportunities</h1>
          <p>Manage current postings through review and their closing date.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="button-secondary" href="/feedback" aria-label="Contact the OppScout admin team">Contact admin</Link>
          <span className="pill">{opportunities.length} total</span>
        </div>
      </header>
      <p className="mb-5 text-sm text-navy">Need help with publisher verification or a listing? Contact the OppScout team.</p>

      {opportunities.length ? (
        <div className="space-y-5">
          <section aria-label="Opportunity summary" className="grid gap-3 sm:grid-cols-3">
            {[
              ["All listings", opportunities.length],
              ["Published", publishedCount],
              ["In review", reviewCount],
            ].map(([label, count]) => (
              <article key={label} className="rounded-2xl border border-ink/[.08] bg-white px-4 py-3 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy">{label}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">{count}</p>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-ink/[.08] bg-white shadow-soft" aria-label="Opportunity listings">
            <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-6 border-b border-ink/[.08] bg-cream/60 px-5 py-3 text-xs font-bold uppercase tracking-wide text-navy sm:grid">
              <span>Opportunity</span><span>Status</span><span>Action</span>
            </div>
            <ul className="divide-y divide-ink/[.08]">
              {opportunities.map((item) => (
                <li key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6">
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-ink">{item.title}</h2>
                    <p className="mt-1 text-xs capitalize text-navy">
                      {item.category} · {item.workMode} · {item.deadline ? `Closes ${item.deadline.toLocaleDateString("en-UG")}` : "Rolling; no closing date"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={item.verificationStatus} />
                    <StatusBadge value={item.status} />
                  </div>
                  <Link className="button-secondary justify-self-start sm:justify-self-end" href={`/dashboard/opportunities/${item.id}/edit`}>Edit listing</Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <EmptyState
          title="Your first opportunity starts here"
          description="There are no active postings right now. Past-deadline and stale listings are removed automatically. Post a current opportunity for review."
          href="/dashboard/opportunities/new"
          action="Post your first opportunity"
          background="white"
        />
      )}
    </main>
  );
}
