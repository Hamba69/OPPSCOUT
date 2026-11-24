const SEPARATOR = /\s+[–—-]\s+/;

function normalize(value: string): string {
  return value.toLocaleLowerCase("en").replace(/\s+/g, " ").trim();
}

/**
 * Listing titles are often stored as "Role – Organization (detail)". Cards and the detail page already show the
 * organization on its own line, so this drops the "– Organization" segment and keeps any trailing parenthetical:
 * "Information Technologist – Masindi District Local Government (1 post)" → "Information Technologist (1 post)".
 * Only an exact organization-name match is removed, so a title is never shortened by a guess.
 */
export function displayTitle(title: string, organization: string | null | undefined): string {
  if (!organization?.trim()) return title;
  const parts = title.split(SEPARATOR);
  if (parts.length < 2) return title;
  const last = parts[parts.length - 1]!;
  const match = /^(.*?)(\s*\([^()]*\))?$/.exec(last);
  if (!match || normalize(match[1]!) !== normalize(organization)) return title;
  const head = title.slice(0, title.length - last.length).replace(/\s+[–—-]\s+$/, "");
  const result = `${head}${match[2] ?? ""}`.trim();
  return result || title;
}

/** Words that add length but little meaning on a small tile. */
const FILLER = /\b(international|open call|call for applications|applications? open)\b/gi;
const YEARS = /\b(19|20)\d{2}(\s*[–—\-/]\s*((19|20)?\d{2}))?\b/g;
const MAX_WORDS = 6;

/**
 * A short name for a tile, e.g. "UBC International Scholarship 2026 (Undergraduate)" → "UBC Scholarship",
 * "AI Reporting Grant – Pulitzer Center" → "AI Reporting Grant". Drops brackets, years, filler words and
 * anything after a spaced dash (usually the organisation or place, shown separately). Never empty.
 */
export function shortTitle(title: string, organization?: string | null): string {
  let value = displayTitle(title, organization);
  value = value.replace(/\s*\([^()]*\)/g, " ");
  value = value.split(/\s+[–—]\s+/)[0]!;
  value = value.replace(YEARS, " ").replace(FILLER, " ");
  value = value.replace(/\s*[,:;/–—-]\s*$/g, "").replace(/^\s*[,:;/–—-]\s*/g, "").replace(/\s{2,}/g, " ").trim();
  // Too long: keep the part before the first comma ("Graduate Software Engineer, Open Source…"), else cut
  // at a word boundary, never ending on a small word like "and".
  if (value.split(" ").length > MAX_WORDS && value.includes(",")) {
    const head = value.split(",")[0]!.trim();
    if (head.split(" ").length >= 2) value = head;
  }
  const words = value.split(" ");
  if (words.length > MAX_WORDS) {
    const kept = words.slice(0, MAX_WORDS);
    while (kept.length > 2 && /^(and|or|of|for|the|in|at|to|with|on|a|an|&)$/i.test(kept[kept.length - 1]!.replace(/[,:;]$/, ""))) kept.pop();
    value = `${kept.join(" ").replace(/[,:;]$/, "")}…`;
  }
  return value || title;
}
