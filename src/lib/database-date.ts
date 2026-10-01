/** Prisma timestamp columns are stored as UTC but REST returns them without a zone. */
export function parseDatabaseDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  const text = String(value);
  const withoutZone = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(text);
  return new Date(withoutZone ? `${text}Z` : text);
}
