/** Opportunity categories available in the supplied database records, in display order. */
export const OPPORTUNITY_TYPES = ["job", "internship", "scholarship", "fellowship", "grant", "training", "consultancy", "exhibition"] as const;

export function allOpportunityTypes(present: string[] = []): string[] {
  const unique = [...new Set(present)];
  const known = OPPORTUNITY_TYPES.filter((type) => unique.includes(type));
  const other = unique.filter((type) => !(OPPORTUNITY_TYPES as readonly string[]).includes(type)).sort();
  return [...known, ...other];
}
