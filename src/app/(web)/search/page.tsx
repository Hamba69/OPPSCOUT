import type { Metadata } from "next";

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
  const searched = Boolean(q.trim() || type);
  const { items, categories } = await browseOpportunities(userId, { type: type || undefined, query: q }, now);
  return <main className="page-shell animate-in">
    <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Search opportunities</h1>
    <p className="mt-1 text-sm text-navy">Look for jobs, scholarships, grants, internships and more.</p>
    <form action="/search" method="get" role="search" className="card mt-5 space-y-4">
      <label><span className="label">What are you looking for?</span><input className="field" type="search" name="q" defaultValue={q} placeholder="Title, organization, skill or place" /></label>
      <label><span className="label">Type of opportunity</span><select className="field" name="type" defaultValue={type}><option value="">All types</option>{categories.map((name) => <option key={name} value={name}>{choiceLabel(name)}</option>)}</select></label>
      <button className="button w-full sm:w-auto">Search</button>
    </form>
    {searched ? <section className="mt-6" aria-live="polite">
      <h2 className="text-lg font-extrabold text-ink">{items.length} {items.length === 1 ? "result" : "results"}{q.trim() && <> for “{q.trim()}”</>}{type && <> in {choiceLabel(type)}</>}</h2>
      {items.length
        ? <div className="mt-4 grid gap-5 md:grid-cols-2">{items.map((item) => <OpportunityListCard key={item.id} item={item} now={now} />)}</div>
        : <p className="card mt-4 bg-butter text-sm text-navy">No opportunities found. Try different words or choose All types.</p>}
    </section> : <section className="mt-6"><h2 className="text-lg font-extrabold text-ink">Browse by type</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{categories.map((name) => <li key={name}><a href={`/search?type=${encodeURIComponent(name)}`} className="card flex min-h-16 items-center justify-center text-center font-bold text-ink hover:bg-butter">{choiceLabel(name)}</a></li>)}</ul></section>}
  </main>;
}
