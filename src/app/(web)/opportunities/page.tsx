import type { Metadata } from "next";
import Link from "next/link";

import { OpportunitiesBrowser } from "@/components/opportunities-browser";
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
  const [auth, params] = await Promise.all([requirePageAuth(["user"]), searchParams]);
  const { userId } = auth;
  const { type = "", q = "" } = params;
  const now = new Date();
  const query = q.trim();

  const { items, categories } = await browseOpportunities(
    userId,
    { type: type || undefined, query: query || undefined },
    now,
  );

  const typeHref = (name?: string): string => {
    const params = new URLSearchParams();
    if (name) params.set("type", name);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `/opportunities?${qs}` : "/opportunities";
  };

  return (
    <main className="page-shell animate-in sm:!py-10">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">The Opportunities</h1>
        <p className="mt-1 text-sm text-navy">Verified, open opportunities that meet your profile and eligibility</p>
      </header>

      <div className="mt-8 flex flex-col gap-6 md:flex-row md:gap-10">
        <nav
          aria-label="Filter by category"
          className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:px-0"
        >
          <Link href={typeHref()} className="rail-link" aria-current={!type ? "page" : undefined}>
            All
          </Link>
          {categories.map((name) => (
            <Link
              key={name}
              href={typeHref(name)}
              className="rail-link"
              aria-current={type === name ? "page" : undefined}
            >
              {choiceLabel(name)}
            </Link>
          ))}
        </nav>

        <section aria-label="Opportunities" className="min-w-0 flex-1">
          <form action="/opportunities" method="get" role="search">
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

          {(query || type) && (
            <div className="mt-3 flex justify-end">
              <Link
                href="/opportunities"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline underline-offset-4"
              >
                Clear filters
              </Link>
            </div>
          )}
          {items.length ? (
            <OpportunitiesBrowser items={items} now={now} />
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
        </section>
      </div>
    </main>
  );
}
