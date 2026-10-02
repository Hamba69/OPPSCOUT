import type { Metadata } from "next";
import Link from "next/link";

import { OpportunityListCard } from "@/components/opportunity-list-card";
import { requirePageAuth } from "@/lib/auth";
import { browseOpportunities } from "@/lib/opportunity-browse";
import { choiceLabel } from "@/services/profile/choices";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Opportunities" };

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const { type } = await searchParams;
  const now = new Date();
  const { items, categories } = await browseOpportunities(userId, { type }, now);
  const chip = (active: boolean): string => `chip ${active ? "!border-amber !bg-amber !text-ink" : ""}`;
  return <main className="page-shell animate-in">
    <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Opportunities</h1>
    <p className="mt-1 text-sm text-navy">All open, verified opportunities. Those that fit your profile are shown first.</p>
    <nav aria-label="Filter by type" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <Link href="/opportunities" className={chip(!type)} aria-current={!type ? "page" : undefined}>All</Link>
      {categories.map((name) => <Link key={name} href={`/opportunities?type=${encodeURIComponent(name)}`} className={chip(type === name)} aria-current={type === name ? "page" : undefined}>{choiceLabel(name)}</Link>)}
    </nav>
    <p className="mt-5 text-sm font-semibold text-navy" aria-live="polite">{items.length} {items.length === 1 ? "opportunity" : "opportunities"}</p>
    {items.length
      ? <div className="mt-3 grid gap-5 md:grid-cols-2">{items.map((item) => <OpportunityListCard key={item.id} item={item} now={now} />)}</div>
      : <section className="card mt-4 bg-butter text-center"><h2 className="text-lg font-extrabold text-ink">No opportunities in this category right now</h2><p className="mt-2 text-sm text-navy">New listings are added regularly. Try another category.</p><Link href="/opportunities" className="button mt-4">Show all</Link></section>}
  </main>;
}
