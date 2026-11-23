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
