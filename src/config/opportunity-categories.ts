const FLEXIBLE_GEOGRAPHY_CATEGORIES = new Set([
  "scholarship",
  "grant",
  "fellowship",
  "training",
  "internship",
]);

export function isFlexibleGeographyCategory(category: string): boolean {
  const normalized = category.trim().toLowerCase().replace(/s$/, "");
  return FLEXIBLE_GEOGRAPHY_CATEGORIES.has(normalized);
}
