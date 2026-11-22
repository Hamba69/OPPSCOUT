"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { PAGE, SortSelect, feedCategories, searchAndSort, type FeedItem, type Sort } from "@/components/feed-browser";
import { MatchCard } from "@/components/match-card";
import { choiceLabel } from "@/services/profile/choices";

/** Matches strictly from one category ("all" shows every match). Switching is done with the All / Jobs / … chips. */
export function CategoryMatches({ items, category }: { items: FeedItem[]; category: string }): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("best");
  const [limit, setLimit] = useState(PAGE);
  const all = category === "all";
  const categories = useMemo(() => feedCategories(items), [items]);
  const label = all ? "All" : categories.find((entry) => entry.type === category)?.label ?? choiceLabel(category);
  const inCategory = useMemo(() => all ? items : items.filter((item) => item.category.trim().toLowerCase() === category), [items, category, all]);
  const visible = useMemo(() => searchAndSort(inCategory, query, sort), [inCategory, query, sort]);

  return <>
    <div className="flex items-center gap-3">
      <BackButton fallbackHref="/feed" label="Back to matches" />
      <h1 className="!m-0 min-w-0 !text-left !text-[1.375rem] !font-extrabold !leading-tight text-ink">{all ? "Today\u2019s matches" : `${label} matches`}</h1>
    </div>

    <nav aria-label="Match categories" className="chip-row">
      <Link replace href="/feed/all" aria-current={all ? "page" : undefined} className="chip">All</Link>
      {categories.map((entry) => <Link replace key={entry.type} href={`/feed/${encodeURIComponent(entry.type)}`} aria-current={entry.type === category ? "page" : undefined} className="chip">{entry.label}</Link>)}
    </nav>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="search-pill !max-w-[26.25rem] flex-1">
        <Icon name="search" className="shrink-0 text-navy" />
        <span className="sr-only">Search {all ? "matches" : `${label} matches`}</span>
        <input type="search" placeholder="Search by title, organization or place" value={query}
          onChange={(event) => { setQuery(event.target.value); setLimit(PAGE); }} />
      </label>
      <SortSelect sort={sort} onChange={(next) => { setSort(next); setLimit(PAGE); }} />
    </div>

    <section aria-label={all ? "All matches" : `${label} matches`} className="flex flex-col gap-4">
      <p className="sr-only" role="status">{visible.length} {visible.length === 1 ? "match" : "matches"}</p>
      {visible.length
        ? <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{visible.slice(0, limit).map((item) => <MatchCard key={item.opportunityId} {...item} />)}</div>
        : !inCategory.length
          ? <div className="surface text-center"><h2 className="text-lg font-bold text-ink">No matches in this category yet</h2><p className="mt-2 text-sm text-navy">Tap All or another category above.</p></div>
          : <div className="surface text-center"><h2 className="text-lg font-bold text-ink">Nothing matches that search</h2><p className="mt-2 text-sm text-navy">Try a different word.</p></div>}
      {visible.length > limit && <button type="button" className="button-secondary self-center" onClick={() => setLimit((current) => current + PAGE)}>Show more ({visible.length - limit} more)</button>}
    </section>
  </>;
}
