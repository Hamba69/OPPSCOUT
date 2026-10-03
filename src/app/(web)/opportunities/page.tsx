import type { Metadata } from "next";
import Link from "next/link";

import { OpportunityListCard } from "@/components/opportunity-list-card";
import { requirePageAuth } from "@/lib/auth";
import { browseOpportunities } from "@/lib/opportunity-browse";
import { choiceLabel } from "@/services/profile/choices";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Opportunities" };

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const { type = "", q = "" } = await searchParams;
  const now = new Date();
  const query = q.trim();

  const { items, categories } = await browseOpportunities(
    userId,
    { type: type || undefined, query: query || undefined },
    now,
  );

  const chip = (active: boolean): string =>
    `chip ${active ? "!border-amber !bg-amber !text-ink" : ""}`;

  const typeHref = (name?: string): string => {
    const params = new URLSearchParams();
    if (name) params.set("type", name);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `/opportunities?${qs}` : "/opportunities";
  };

  return (
    <main className="page-shell animate-in">
      <h1 className="text-2xl font-semibold text-ink sm:text-3xl"> The Opportunities</h1>
      <p className="mt-1 text-sm text-navy">
        Open catalog listings, with verified matches prioritised
      </p>

      <form action="/opportunities" method="get" role="search" className="mt-5">
        {type && <input type="hidden" name="type" value={type} />}
        <label>
          <span className="sr-only">Search</span>
          <span className="flex gap-2">
            <input
              className="field"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Institution, skill, title, or place"
            />
            <button className="button shrink-0" type="submit">
              Search
            </button>
          </span>
        </label>
      </form>

      <nav
        aria-label="Filter by type"
        className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      >
        <Link href={typeHref()} className={chip(!type)} aria-current={!type ? "page" : undefined}>
          All
        </Link>
        {categories.map((name) => (
          <Link
            key={name}
            href={typeHref(name)}
            className={chip(type === name)}
            aria-current={type === name ? "page" : undefined}
          >
            {choiceLabel(name)}
          </Link>
        ))}
      </nav>

      {(query || type) && (
        <div className="mt-5 flex justify-end">
          <Link
            href="/opportunities"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline underline-offset-4"
          >
            Clear filters
          </Link>
        </div>
      )}
      {items.length ? (
        <div className="mt-3 grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <OpportunityListCard key={item.id} item={item} now={now} />
          ))}
        </div>
      ) : (
        <section className="card mt-4 bg-butter text-center">
          <h2 className="text-lg font-extrabold text-ink">No opportunities found</h2>
          <p className="mt-2 text-sm text-navy">
            Try different words, another category, or clear your filters.
          </p>
          <Link href="/opportunities" className="button mt-4">
            Show all
          </Link>
        </section>
      )}
    </main>
  );
}
