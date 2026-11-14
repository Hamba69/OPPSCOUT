import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";

import { Icon } from "@/components/app-shell";
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
    <main className="animate-in flex flex-col gap-6">
      <header className="title-card">
        <h1>Opportunities</h1>
      </header>

      <Form action="/opportunities" prefetch={false} role="search" className="w-full">
        {type && <input type="hidden" name="type" value={type} />}
        <label className="search-pill !max-w-[26.25rem]">
          <Icon name="search" className="shrink-0 text-navy" />
          <span className="sr-only">Search</span>
          <input type="search" name="q" defaultValue={q} placeholder="Institution, skill, title, or place" />
          <button className="button !min-h-9 !px-4 shrink-0" type="submit">Search</button>
        </label>
      </Form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by category" className="flex flex-wrap gap-1.5">
          <Link href={typeHref()} prefetch={false} className="chip" aria-current={!type ? "page" : undefined}>All</Link>
          {categories.map((name) => (
            <Link key={name} href={typeHref(name)} prefetch={false} className="chip" aria-current={type === name ? "page" : undefined}>
              {choiceLabel(name)}
            </Link>
          ))}
        </nav>
        {(query || type) && (
          <Link href="/opportunities" prefetch={false} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline underline-offset-4">
            Clear filters
          </Link>
        )}
      </div>

      <section aria-label="Opportunities">
        {items.length ? (
          <OpportunitiesBrowser items={items} now={now} />
        ) : (
          <section className="surface text-center">
            <h2 className="text-lg font-extrabold text-ink">No opportunities found</h2>
            <p className="mt-2 text-sm text-navy">Try different words, another category, or clear your filters.</p>
            <Link href="/opportunities" className="button mt-4">Show all</Link>
          </section>
        )}
      </section>
    </main>
  );
}
