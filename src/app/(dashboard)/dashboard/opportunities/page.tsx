import Link from "next/link";

import { Icon } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PublisherOpportunityTable } from "@/components/publisher-opportunity-table";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ProviderOpportunitiesPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const opportunities = await (await getRepository()).listOpportunities({
    organizationId: auth.organizationId ?? undefined,
    origin: "organization",
    statuses: ["open", "closing_soon"],
  });
  return (
    <main className="animate-in flex flex-col gap-6">
      <header className="title-card !w-full !flex-row !flex-wrap !items-center !justify-between gap-4">
        <div>
          <h1>Your opportunities</h1>
          <p>Manage current postings through review and their closing date.</p>
        </div>
        <Link className="button !min-h-11" href="/dashboard/opportunities/new"><Icon name="plus" size={15} strokeWidth={2.2} />Post an opportunity</Link>
      </header>
      {opportunities.length ? (
        <PublisherOpportunityTable opportunities={opportunities} title="Opportunity listings" filterable />
      ) : (
        <EmptyState
          title="Your first opportunity starts here"
          description="There are no active postings right now. Past-deadline and stale listings are removed automatically. Post a current opportunity for review."
          href="/dashboard/opportunities/new"
          action="Post your first opportunity"
          background="white"
        />
      )}
      <section className="glass flex flex-wrap items-center justify-between gap-3 !rounded-[1.375rem] px-5 py-4">
        <p className="text-sm text-navy">Need help with publisher verification or a listing? Contact the OppScout team.</p>
        <Link className="button-secondary" href="/feedback" aria-label="Contact the OppScout admin team">Contact admin</Link>
      </section>
    </main>
  );
}
