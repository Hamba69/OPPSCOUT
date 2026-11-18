"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon, type IconName } from "@/components/app-shell";
import { CategoryArtwork } from "@/components/category-artwork";
import { MatchCard, type MatchCardProps } from "@/components/match-card";

export type FeedItem = MatchCardProps & { category: string; categoryLabel: string };
export type Sort = "best" | "closing";
export type FeedCategory = { label: string; type: string; icon: IconName };

/** Matches shown at first and added by each "Show more" (two rows of three on desktop). */
export const PAGE = 6;

const closesAt = (item: FeedItem): number => (item.deadline ? Date.parse(item.deadline) : Number.POSITIVE_INFINITY);

const categoryOrder = ["job", "scholarship", "internship", "grant"];
const categoryIcons: Partial<Record<string, IconName>> = {
  job: "job", scholarship: "scholarship", internship: "internship", grant: "grant",
  fellowship: "fellowship", training: "training", exhibition: "exhibition",
};

/** The categories present in the seeker's matches, most common types first. */
export function feedCategories(items: FeedItem[]): FeedCategory[] {
  const unique = new Map<string, FeedCategory>();
  for (const item of items) {
    const type = item.category.trim().toLowerCase();
    if (type && !unique.has(type)) unique.set(type, { label: item.categoryLabel, type, icon: categoryIcons[type] ?? "opportunities" });
  }
  return [...unique.values()].sort((a, b) => {
    const aOrder = categoryOrder.indexOf(a.type);
    const bOrder = categoryOrder.indexOf(b.type);
    if (aOrder !== -1 || bOrder !== -1) return (aOrder === -1 ? categoryOrder.length : aOrder) - (bOrder === -1 ? categoryOrder.length : bOrder);
    return a.label.localeCompare(b.label);
  });
}

/** Search text, then sort, over a list of matches. */
export function searchAndSort(items: FeedItem[], query: string, sort: Sort): FeedItem[] {
  const needle = query.trim().toLowerCase();
  const filtered = items.filter((item) => `${item.title} ${item.organization} ${item.location}`.toLowerCase().includes(needle));
  return sort === "closing" ? [...filtered].sort((a, b) => (closesAt(a) === closesAt(b) ? 0 : closesAt(a) < closesAt(b) ? -1 : 1)) : filtered;
}

export function SortSelect({ sort, onChange }: { sort: Sort; onChange: (sort: Sort) => void }): React.JSX.Element {
  return <label>
    <span className="sr-only">Sort matches</span>
    <select className="chip cursor-pointer appearance-none !pr-4" value={sort} onChange={(event) => onChange(event.target.value as Sort)}>
      <option value="best">Best match</option>
      <option value="closing">Closing soon</option>
    </select>
  </label>;
}

/**
 * Greeting, search, then category tiles that each open that category's matches on their own page.
 * "Recommended for you" is shown from tablet width up; on phones it only appears while searching, to keep the home screen short.
 */
export function FeedBrowser({ items, salutation, firstName }: { items: FeedItem[]; salutation: string; firstName?: string }): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("best");
  const [limit, setLimit] = useState(PAGE);
  const categories = useMemo(() => feedCategories(items), [items]);
  const visible = useMemo(() => searchAndSort(items, query, sort), [items, query, sort]);
  const searching = query.trim().length > 0;

  const results = (
    <section aria-label="Matches" className={`${searching ? "flex" : "hidden sm:flex"} flex-col gap-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">{searching ? "Search results" : "Recommended for you"}</h2>
        <SortSelect sort={sort} onChange={(next) => { setSort(next); setLimit(PAGE); }} />
      </div>
      {visible.length
        ? <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{visible.slice(0, limit).map((item) => <MatchCard key={item.opportunityId} {...item} />)}</div>
        : <div className="surface text-center"><h2 className="text-lg font-bold text-ink">Nothing matches that search</h2><p className="mt-2 text-sm text-navy">Try a different word, or browse a category below.</p></div>}
      {visible.length > limit && <button type="button" className="button-secondary self-center" onClick={() => setLimit((current) => current + PAGE)}>Show more ({visible.length - limit} more)</button>}
    </section>
  );

  return <>
    <section className="greeting">
      <div className="orb orb-lg" aria-hidden="true" />
      <h1>{salutation}{firstName ? <> <strong>{firstName}</strong></> : null}, here&apos;s what fits you today.</h1>
    </section>

    <label className="search-pill self-center !max-w-[40rem]">
      <Icon name="search" className="shrink-0 text-navy" />
      <span className="sr-only">Search opportunities</span>
      <input type="search" placeholder="Search by title, organization or place" value={query}
        onChange={(event) => { setQuery(event.target.value); setLimit(PAGE); }} />
    </label>

    {searching && results}

    <div className="tile-grid-wrap"><nav aria-label="Browse by type" className="tile-grid">
      {categories.map((tile) => <Link key={tile.type} href={`/feed/${encodeURIComponent(tile.type)}`} className={`tile tile-tinted tint-${tile.type}`}>
        <span className="relative z-[1] pr-6">{tile.label}</span>
        <CategoryArtwork category={tile.type} className="tile-art" />
      </Link>)}
    </nav></div>

    {!searching && results}

  </>;
}
