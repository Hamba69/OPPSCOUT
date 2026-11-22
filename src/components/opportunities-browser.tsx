"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/app-shell";
import { OpportunityListCard, type OpportunityListItem } from "@/components/opportunity-list-card";
import { choiceLabel } from "@/services/profile/choices";

type Sort = "best" | "closing";

/** Cards shown at first and added by each "Show more" (four rows of three on desktop). */
const PAGE = 12;

const deadlineTime = (item: OpportunityListItem): number => item.deadline?.getTime() ?? Number.POSITIVE_INFINITY;

/**
 * Search, category chips, sort and paging all run in the browser over the list the server sent once,
 * so changing a filter is instant. The address bar is kept in sync (?type=&q=) without reloading.
 */
export function OpportunitiesBrowser({
  items,
  categories,
  now,
  initialType = "",
  initialQuery = "",
}: {
  items: OpportunityListItem[];
  categories: string[];
  now: Date;
  initialType?: string;
  initialQuery?: string;
}): React.JSX.Element {
  const [type, setType] = useState(initialType);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>("best");
  const [limit, setLimit] = useState(PAGE);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (deferredQuery.trim()) params.set("q", deferredQuery.trim());
    const next = params.toString() ? `/opportunities?${params.toString()}` : "/opportunities";
    if (`${window.location.pathname}${window.location.search}` !== next) window.history.replaceState(null, "", next);
  }, [type, deferredQuery]);

  const visible = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const filtered = items.filter((item) => (!type || item.category === type)
      && (!needle || (item.search ?? `${item.title} ${item.organization} ${item.location} ${item.category}`.toLowerCase()).includes(needle)));
    return filtered.sort((a, b) => {
      if (sort === "closing") return deadlineTime(a) - deadlineTime(b);
      const scoreDifference = (b.matchScore ?? -1) - (a.matchScore ?? -1);
      return scoreDifference || deadlineTime(a) - deadlineTime(b);
    });
  }, [items, type, deferredQuery, sort]);

  const pick = (value: string): void => { setType(value); setLimit(PAGE); };

  return (
    <>
      <div role="group" aria-label="Filter by category" className="chip-row">
        <button type="button" className="chip" aria-pressed={!type} onClick={() => pick("")}>All</button>
        {categories.map((name) => (
          <button key={name} type="button" className="chip" aria-pressed={type === name} onClick={() => pick(name)}>
            {choiceLabel(name)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form role="search" className="min-w-0 flex-1" onSubmit={(event) => event.preventDefault()}>
          <label className="search-pill !max-w-[26.25rem]">
            <Icon name="search" className="shrink-0 text-navy" />
            <span className="sr-only">Search</span>
            <input type="search" name="q" value={query} placeholder="Institution, skill, title, or place"
              onChange={(event) => { setQuery(event.target.value); setLimit(PAGE); }} />
          </label>
        </form>
        <label>
          <span className="sr-only">Sort opportunities</span>
          <select className="chip cursor-pointer appearance-none !pr-4" value={sort} onChange={(event) => { setSort(event.target.value as Sort); setLimit(PAGE); }}>
            <option value="best">Best matches</option>
            <option value="closing">Closing soon</option>
          </select>
        </label>
      </div>

      <section aria-label="Opportunities" className="flex flex-col gap-4">
        <p className="sr-only" role="status">{visible.length} {visible.length === 1 ? "opportunity" : "opportunities"} found</p>
        {visible.length ? (
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.slice(0, limit).map((item) => <OpportunityListCard key={item.id} item={item} now={now} />)}
          </div>
        ) : (
          <section className="surface text-center">
            <h2 className="text-lg font-extrabold text-ink">No opportunities found</h2>
            <p className="mt-2 text-sm text-navy">Try different words, or tap All or another category above.</p>
          </section>
        )}
        {visible.length > limit && (
          <button type="button" className="button-secondary self-center" onClick={() => setLimit((current) => current + PAGE)}>
            Show more ({visible.length - limit} more)
          </button>
        )}
      </section>
    </>
  );
}
