"use client";

import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { PAGE, SortSelect, feedCategories, searchAndSort, type FeedItem, type Sort } from "@/components/feed-browser";
import { MatchCard } from "@/components/match-card";

/**
 * Today's matches. The type filters work in the browser over the matches the server sent once, like the
 * Opportunities page: switching type never reloads the page or runs matching again. The address bar is kept
 * in sync (/feed/all, /feed/job, …) without reloading, so a type can still be linked to directly.
 */
export function CategoryMatches({ items, category }: { items: FeedItem[]; category: string }): React.JSX.Element {
  const categories = useMemo(() => feedCategories(items), [items]);
  const [type, setType] = useState(category !== "all" && categories.some((entry) => entry.type === category) ? category : "all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("best");
  const [limit, setLimit] = useState(PAGE);
  const all = type === "all";
  const inCategory = useMemo(() => all ? items : items.filter((item) => item.category.trim().toLowerCase() === type), [items, type, all]);
  const visible = useMemo(() => searchAndSort(inCategory, query, sort), [inCategory, query, sort]);

  useEffect(() => {
    const next = `/feed/${encodeURIComponent(type)}`;
    if (window.location.pathname !== next) window.history.replaceState(null, "", next);
  }, [type]);

  const pick = (value: string): void => { setType(value); setLimit(PAGE); };

  return <>
    <div className="flex items-center gap-3">
      <BackButton fallbackHref="/feed" label="Back to matches" />
      <h1 className="!m-0 min-w-0 !text-left !text-[1.375rem] !font-extrabold !leading-tight text-ink">Today&#8217;s matches</h1>
    </div>

    <div role="group" aria-label="Filter matches by type" className="chip-row">
      <button type="button" className="chip" aria-pressed={all} onClick={() => pick("all")}>All</button>
      {categories.map((entry) => <button type="button" key={entry.type} className="chip" aria-pressed={entry.type === type} onClick={() => pick(entry.type)}>{entry.label}</button>)}
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="search-pill !max-w-[26.25rem] flex-1">
        <Icon name="search" className="shrink-0 text-navy" />
        <span className="sr-only">Search your matches</span>
        <input type="search" placeholder="Search by title, organization or place" value={query}
          onChange={(event) => { setQuery(event.target.value); setLimit(PAGE); }} />
      </label>
      <SortSelect sort={sort} onChange={(next) => { setSort(next); setLimit(PAGE); }} />
    </div>

    <section aria-label="Matches" className="flex flex-col gap-4">
      <p className="sr-only" role="status">{visible.length} {visible.length === 1 ? "match" : "matches"}</p>
      {visible.length
        ? <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{visible.slice(0, limit).map((item) => <MatchCard key={item.opportunityId} {...item} />)}</div>
        : !inCategory.length
          ? <div className="surface text-center"><h2 className="text-lg font-bold text-ink">No matches of this type today</h2><p className="mt-2 text-sm text-navy">Tap All or another type above.</p></div>
          : <div className="surface text-center"><h2 className="text-lg font-bold text-ink">Nothing matches that search</h2><p className="mt-2 text-sm text-navy">Try a different word.</p></div>}
      {visible.length > limit && <button type="button" className="button-secondary self-center" onClick={() => setLimit((current) => current + PAGE)}>Show more ({visible.length - limit} more)</button>}
    </section>
  </>;
}
