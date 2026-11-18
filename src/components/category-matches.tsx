"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon } from "@/components/app-shell";
import { ArrowLeftIcon } from "@/components/icons";
import { PAGE, SortSelect, feedCategories, searchAndSort, type FeedItem, type Sort } from "@/components/feed-browser";
import { MatchCard } from "@/components/match-card";
import { choiceLabel } from "@/services/profile/choices";

const chipClass = (active: boolean): string =>
  `shrink-0 rounded-full border px-4 py-2 text-sm font-semibold text-navy transition hover:text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40 ${active ? "border-[#F5D76E] bg-white/85 text-ink shadow-sm" : "border-transparent"}`;

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
    <header className="flex flex-col gap-3">
      <Link href="/feed" className="inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-bold text-navy transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf"><ArrowLeftIcon />Back to matches</Link>
      <div className="title-card"><h1>{all ? "All matches" : `${label} matches`}</h1></div>
    </header>

    <nav aria-label="Match categories" className="nav-capsule category-nav w-full max-w-full justify-start gap-0.5 overflow-x-auto">
      <Link href="/feed/all" aria-current={all ? "page" : undefined} className={chipClass(all)}>All</Link>
      {categories.map((entry) => <Link key={entry.type} href={`/feed/${encodeURIComponent(entry.type)}`} aria-current={entry.type === category ? "page" : undefined} className={chipClass(entry.type === category)}>{entry.label}</Link>)}
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
