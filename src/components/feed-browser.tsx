"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon, type IconName } from "@/components/app-shell";
import { MatchCard, type MatchCardProps } from "@/components/match-card";

export type FeedItem = MatchCardProps & { category: string; categoryLabel: string };
type Sort = "best" | "closing";

/** Matches shown at first and added by each "Show more" (two rows of three on desktop). */
const PAGE = 6;

const closesAt = (item: FeedItem): number => (item.deadline ? Date.parse(item.deadline) : Number.POSITIVE_INFINITY);

const tiles: { label: string; type: string; icon: IconName }[] = [
  { label: "Jobs", type: "job", icon: "job" },
  { label: "Scholarships", type: "scholarship", icon: "scholarship" },
  { label: "Internships", type: "internship", icon: "internship" },
  { label: "Grants", type: "grant", icon: "grant" },
];

/** Greeting, search below it, category shortcuts, then the ranked matches as a grid of equal cards. */
export function FeedBrowser({ items, salutation, firstName }: { items: FeedItem[]; salutation: string; firstName?: string }): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("best");
  const [limit, setLimit] = useState(PAGE);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = items.filter((item) => `${item.title} ${item.organization} ${item.location}`.toLowerCase().includes(needle));
    return sort === "closing" ? [...filtered].sort((a, b) => (closesAt(a) === closesAt(b) ? 0 : closesAt(a) < closesAt(b) ? -1 : 1)) : filtered;
  }, [items, query, sort]);

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

    <nav aria-label="Browse by type" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => <Link key={tile.type} href={`/opportunities?type=${tile.type}`} className="tile">
        <span className="icon-chip"><Icon name={tile.icon} size={18} /></span>
        <span className="flex items-center justify-between">{tile.label}<Icon name="chevron" size={14} strokeWidth={2.5} className="text-[#8A6400]" /></span>
      </Link>)}
    </nav>

    <section aria-label="Matches" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Recommended for you</h2>
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
        : <div className="surface text-center"><h2 className="text-lg font-bold text-ink">Nothing matches that search</h2><p className="mt-2 text-sm text-navy">Try a different word, or show all your matches again.</p>
          <button type="button" className="button mt-4" onClick={() => { setQuery(""); setLimit(PAGE); }}>Show all matches</button></div>}
      {visible.length > limit && <button type="button" className="button-secondary self-center" onClick={() => setLimit((current) => current + PAGE)}>Show more ({visible.length - limit} more)</button>}
    </section>
  </>;
}
