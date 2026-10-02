"use client";

import { useMemo, useState } from "react";
import { MatchCard, type MatchCardProps } from "@/components/match-card";

export type FeedItem = MatchCardProps & { category: string };

export function FeedBrowser({ items }: { items: FeedItem[] }): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("For you");
  const [limit, setLimit] = useState(20);
  const categories = useMemo(() => ["For you", ...Array.from(new Set(items.map((item) => item.category)))], [items]);
  const visible = items.filter((item) => (category === "For you" || item.category === category)
    && `${item.title} ${item.organization} ${item.location}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div>
    <label className="relative mt-6 block">
      <span className="sr-only">Search opportunities</span>
      <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
      <input className="field !border-honey pl-11" type="search" placeholder="Search by title, organization or place" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(20); }} />
    </label>
    <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by category">
      {categories.map((name) => <button key={name} type="button" className="chip" aria-pressed={category === name} onClick={() => { setCategory(name); setLimit(20); }}>{name}</button>)}
    </div>
    {visible.length ? <div className="mt-6 grid gap-5 md:grid-cols-2">{visible.slice(0, limit).map((item) => <MatchCard key={item.opportunityId} {...item} />)}</div>
      : <div className="card mt-6 bg-butter text-center"><h2 className="text-lg font-extrabold text-ink">Nothing matches that search</h2><p className="mt-2 text-sm text-navy">Try a different word, or show all your matches again.</p>
        <button type="button" className="button mt-4" onClick={() => { setQuery(""); setCategory("For you"); }}>Show all matches</button></div>}
    {visible.length > limit && <button type="button" className="button-secondary mt-6" onClick={() => setLimit(current => current + 20)}>Show more opportunities ({visible.length - limit} remaining)</button>}
  </div>;
}
