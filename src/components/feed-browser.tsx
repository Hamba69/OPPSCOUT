"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon, type IconName } from "@/components/app-shell";
import { CategoryArtwork } from "@/components/category-artwork";
import { MatchCard, type MatchCardProps } from "@/components/match-card";

export type FeedItem = MatchCardProps & { category: string; categoryLabel: string };
type Sort = "best" | "closing";

/** Matches shown at first and added by each "Show more" (two rows of three on desktop). */
const PAGE = 6;

const closesAt = (item: FeedItem): number => (item.deadline ? Date.parse(item.deadline) : Number.POSITIVE_INFINITY);

const categoryOrder = ["job", "scholarship", "internship", "grant"];
const categoryIcons: Partial<Record<string, IconName>> = {
  job: "job", scholarship: "scholarship", internship: "internship", grant: "grant",
};

/** Greeting, search below it, category shortcuts, then the ranked matches as a grid of equal cards. */
export function FeedBrowser({ items, salutation, firstName, initialType = "" }: { items: FeedItem[]; salutation: string; firstName?: string; initialType?: string }): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("best");
  const [limit, setLimit] = useState(PAGE);
  const selectedType = initialType.trim().toLowerCase();
  const categories = useMemo(() => {
    const unique = new Map<string, { label: string; type: string; icon: IconName }>();
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
  }, [items]);
  const selectedCategory = categories.find((category) => category.type === selectedType);
  const categoryMatches = useMemo(
    () => selectedType ? items.filter((item) => item.category.trim().toLowerCase() === selectedType) : items,
    [items, selectedType],
  );
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = categoryMatches.filter((item) => `${item.title} ${item.organization} ${item.location}`.toLowerCase().includes(needle));
    return sort === "closing" ? [...filtered].sort((a, b) => (closesAt(a) === closesAt(b) ? 0 : closesAt(a) < closesAt(b) ? -1 : 1)) : filtered;
  }, [categoryMatches, query, sort]);

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

    <div className="tile-grid-wrap"><nav aria-label="Browse by type" className="tile-grid">
      {categories.map((tile) => <Link key={tile.type} href={`/feed?type=${encodeURIComponent(tile.type)}`} aria-current={selectedType === tile.type ? "page" : undefined} className="tile">
        <CategoryArtwork category={tile.type} />
        <span className="flex items-center justify-between gap-2">{tile.label}<Icon name="chevron" size={14} strokeWidth={2.5} className="text-[#8A6400]" /></span>
      </Link>)}
    </nav></div>

    <section aria-label="Matches" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">{selectedType ? `${selectedCategory?.label ?? selectedType.replace(/\b\w/g, (letter) => letter.toUpperCase())} matches` : "Recommended for you"}</h2>
        {selectedType && <Link href="/feed" className="text-sm font-bold text-navy underline underline-offset-2">All matches</Link>}
        <label>
          <span className="sr-only">Sort matches</span>
          <select className="chip cursor-pointer appearance-none !pr-4" value={sort} onChange={(event) => { setSort(event.target.value as Sort); setLimit(PAGE); }}>
            <option value="best">Best match</option>
            <option value="closing">Closing soon</option>
          </select>
        </label>
      </div>
      {visible.length
        ? <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{visible.slice(0, limit).map((item) => <MatchCard key={item.opportunityId} {...item} />)}</div>
        : selectedType && !categoryMatches.length
          ? <div className="surface text-center"><h2 className="text-lg font-bold text-ink">No matches in this category</h2><p className="mt-2 text-sm text-navy">Choose another category or return to all your matches.</p><Link href="/feed" className="button mt-4">All matches</Link></div>
          : <div className="surface text-center"><h2 className="text-lg font-bold text-ink">Nothing matches that search</h2><p className="mt-2 text-sm text-navy">Try a different word, or show all your matches again.</p>
          <button type="button" className="button mt-4" onClick={() => { setQuery(""); setLimit(PAGE); }}>Show all matches</button></div>}
      {visible.length > limit && <button type="button" className="button-secondary self-center" onClick={() => setLimit((current) => current + PAGE)}>Show more ({visible.length - limit} more)</button>}
    </section>
  </>;
}
