"use client";

import { useMemo, useState } from "react";

import { OpportunityListCard, type OpportunityListItem } from "@/components/opportunity-list-card";

type Sort = "best" | "closing";

const deadlineTime = (item: OpportunityListItem): number => item.deadline?.getTime() ?? Number.POSITIVE_INFINITY;

export function OpportunitiesBrowser({
  items,
  now,
}: {
  items: OpportunityListItem[];
  now: Date;
}): React.JSX.Element {
  const [sort, setSort] = useState<Sort>("best");
  const visible = useMemo(() => [...items].sort((a, b) => {
    if (sort === "closing") return deadlineTime(a) - deadlineTime(b);

    const scoreDifference = (b.matchScore ?? -1) - (a.matchScore ?? -1);
    return scoreDifference || deadlineTime(a) - deadlineTime(b);
  }), [items, sort]);

  return (
    <>
      <div className="-mt-2 mb-3 flex justify-end">
        <label>
          <span className="sr-only">Sort opportunities</span>
          <select
            className="chip cursor-pointer appearance-none !pr-4"
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
          >
            <option value="best">Best matches</option>
            <option value="closing">Closing soon</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((item) => (
          <OpportunityListCard key={item.id} item={item} now={now} />
        ))}
      </div>
    </>
  );
}
