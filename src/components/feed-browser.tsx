"use client";

import { useMemo, useState } from "react";
import { MatchCard, type MatchCardProps } from "@/components/match-card";

export type FeedItem = MatchCardProps & { category: string; categoryLabel: string };
type Sort = "best" | "closing";

const closesAt = (item: FeedItem): number => (item.deadline ? Date.parse(item.deadline) : Number.POSITIVE_INFINITY);

export function FeedBrowser({ items }: { items: FeedItem[] }): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("best");
  const [limit, setLimit] = useState(20);
  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) if (!seen.has(item.category)) seen.set(item.category, item.categoryLabel);
    return [...seen];
  }, [items]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = items.filter((item) => (!category || item.category === category)
      && `${item.title} ${item.organization} ${item.location}`.toLowerCase().includes(needle));
    return sort === "closing" ? [...filtered].sort((a, b) => (closesAt(a) === closesAt(b) ? 0 : closesAt(a) < closesAt(b) ? -1 : 1)) : filtered;
  }, [items, query, category, sort]);

  return <div className="flex flex-col gap-6 md:flex-row md:gap-10">
    <nav aria-label="Filter by category" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:px-0">
      <button type="button" className="rail-link" aria-pressed={category === null} onClick={() => { setCategory(null); setLimit(20); }}>All</button>
      {categories.map(([value, label]) => <button key={value} type="button" className="rail-link" aria-pressed={category === value}
        onClick={() => { setCategory(value); setLimit(20); }}>{label}</button>)}
    </nav>
    <section aria-label="Matches" className="min-w-0 flex-1">
      <div className="flex gap-3">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search opportunities</span>
          <input className="field !min-h-11 !rounded-xl !border-ink/20 !py-2" type="search" placeholder="Search by title, organization or place" value={query}
            onChange={(event) => { setQuery(event.target.value); setLimit(20); }} />
        </label>
        <label>
          <span className="sr-only">Sort matches</span>
          <select className="field !min-h-11 !w-auto !rounded-xl !border-ink/20 !py-2" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="best">Best match</option>
            <option value="closing">Closing soon</option>
          </select>
        </label>
      </div>
      {visible.length
        ? <div className="mt-4 flex flex-col gap-4">{visible.slice(0, limit).map((item) => <MatchCard key={item.opportunityId} {...item} />)}</div>
        : <div className="card mt-4 bg-butter text-center"><h2 className="text-lg font-bold text-ink">Nothing matches that search</h2><p className="mt-2 text-sm text-navy">Try a different word, or show all your matches again.</p>
          <button type="button" className="button mt-4" onClick={() => { setQuery(""); setCategory(null); }}>Show all matches</button></div>}
      {visible.length > limit && <button type="button" className="button-secondary mt-4" onClick={() => setLimit((current) => current + 20)}>Show more</button>}
    </section>
  </div>;
}
