/** Every kind of opportunity OppScout offers, in display order. Shown even when no listing of that type is open yet. */
export const OPPORTUNITY_TYPES = ["job", "internship", "scholarship", "fellowship", "grant", "training", "consultancy"] as const;

export function allOpportunityTypes(present: string[] = []): string[] {
  return [...OPPORTUNITY_TYPES, ...[...new Set(present)].filter((type) => !(OPPORTUNITY_TYPES as readonly string[]).includes(type)).sort()];
}
