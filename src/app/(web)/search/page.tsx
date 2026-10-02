import type { Metadata } from "next";
import Link from "next/link";

import { OpportunityListCard } from "@/components/opportunity-list-card";
import { requirePageAuth } from "@/lib/auth";
import { browseOpportunities } from "@/lib/opportunity-browse";
import { choiceLabel } from "@/services/profile/choices";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const { q = "", type = "" } = await searchParams;
  const now = new Date();
  const query = q.trim();
  const searched = Boolean(query || type);
  const { items, categories, counts } = await browseOpportunities(userId, { type: type || undefined, query }, now);
  const typeHref = (name: string): string => `/search?${new URLSearchParams({ ...(query ? { q: query } : {}), type: name }).toString()}`;
  return <main className="page-shell animate-in">
    <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Search opportunities</h1>
    <form action="/search" method="get" role="search" className="mt-5">
      {type && <input type="hidden" name="type" value={type} />}
      <label><span className="label">What are you looking for?</span>
        <span className="flex gap-2"><input className="field" type="search" name="q" defaultValue={q} placeholder="Title, organization, skill or place" /><button className="button shrink-0">Search</button></span></label>
    </form>

    <section className="mt-8" aria-labelledby="browse-by-type">
      <h2 id="browse-by-type" className="text-lg font-extrabold text-ink">Browse by type</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{categories.map((name) => {
        const active = type === name;
        return <li key={name}><Link href={typeHref(name)} aria-current={active ? "true" : undefined}
          className={`card flex min-h-20 flex-col items-center justify-center gap-0.5 text-center font-bold text-ink transition hover:bg-butter ${active ? "!border-amber !bg-amber" : ""}`}>
          {choiceLabel(name)}<span className="text-xs font-semibold text-navy">{counts[name] ?? 0} open</span></Link></li>;
      })}</ul>
    </section>

    {searched && <section className="mt-8" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-ink">{items.length} {items.length === 1 ? "result" : "results"}{query && <> for “{query}”</>}{type && <> in {choiceLabel(type)}</>}</h2>
        <Link href="/search" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline underline-offset-4">Clear search</Link>
      </div>
      {items.length
        ? <div className="mt-4 grid gap-5 md:grid-cols-2">{items.map((item) => <OpportunityListCard key={item.id} item={item} now={now} />)}</div>
        : <p className="card mt-4 bg-butter text-sm text-navy">No opportunities found. Try different words or another type.</p>}
    </section>}
  </main>;
}
