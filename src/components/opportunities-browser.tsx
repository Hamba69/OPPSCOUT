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
      <div className="flex justify-end">
        <label>
          <span className="sr-only">Sort opportunities</span>
          <select
            className="field !min-h-11 !w-auto !rounded-xl !border-ink/20 !py-2"
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
          >
            <option value="best">Best matches</option>
            <option value="closing">Closing soon</option>
          </select>
        </label>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        {visible.map((item) => (
          <OpportunityListCard key={item.id} item={item} now={now} />
        ))}
      </div>
    </>
  );
}
