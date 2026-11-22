"use client";

import type { IconName } from "@/components/app-shell";
import type { MatchCardProps } from "@/components/match-card";

export type FeedItem = MatchCardProps & { category: string; categoryLabel: string };
export type Sort = "best" | "closing";
export type FeedCategory = { label: string; type: string; icon: IconName };

/** Matches shown at first and added by each "Show more" (two rows of three on desktop). */
export const PAGE = 6;

const closesAt = (item: FeedItem): number => (item.deadline ? Date.parse(item.deadline) : Number.POSITIVE_INFINITY);

const categoryOrder = ["job", "scholarship", "internship", "grant"];
const categoryIcons: Partial<Record<string, IconName>> = {
  job: "job", scholarship: "scholarship", internship: "internship", grant: "grant",
  fellowship: "fellowship", training: "training", exhibition: "exhibition",
};

/** The categories present in the seeker's matches, most common types first. */
export function feedCategories(items: FeedItem[]): FeedCategory[] {
  const unique = new Map<string, FeedCategory>();
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
}

/** Search text, then sort, over a list of matches. */
export function searchAndSort(items: FeedItem[], query: string, sort: Sort): FeedItem[] {
  const needle = query.trim().toLowerCase();
  const filtered = items.filter((item) => `${item.title} ${item.organization} ${item.location}`.toLowerCase().includes(needle));
  return sort === "closing" ? [...filtered].sort((a, b) => (closesAt(a) === closesAt(b) ? 0 : closesAt(a) < closesAt(b) ? -1 : 1)) : filtered;
}

export function SortSelect({ sort, onChange }: { sort: Sort; onChange: (sort: Sort) => void }): React.JSX.Element {
  return <label>
    <span className="sr-only">Sort matches</span>
    <select className="chip cursor-pointer appearance-none !pr-4" value={sort} onChange={(event) => onChange(event.target.value as Sort)}>
      <option value="best">Best match</option>
      <option value="closing">Closing soon</option>
    </select>
  </label>;
}
