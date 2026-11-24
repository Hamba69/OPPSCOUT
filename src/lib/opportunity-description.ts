/**
 * Listing descriptions written during research sometimes note that the source gave "no closing time".
 * Seekers read that as "no closing date" even though the listing has one, so those notes are reworded
 * for display. Other wording is left exactly as written.
 */
const REWRITES: Array<[RegExp, string]> = [
  // "...close on 4 December 2026; no closing time is stated, so deliver yours a day early to be safe."
  [/;\s*no closing time is (stated|given|published),?\s*so\s+/gi, ". To be safe, "],
  [/\.\s*no closing time is (stated|given|published),?\s*so\s+/gi, ". To be safe, "],
  // Whole sentences that only explain how the time was chosen.
  [/(^|(?<=[.!?])\s+)[^.!?]*\b(gives|states|lists|publishes|has) no closing time\b[^.!?]*[.!?]/gi, ""],
  [/(^|(?<=[.!?])\s+)[^.!?]*\bclosing time (is )?not (published|stated|given)\b[^.!?]*[.!?]/gi, ""],
  [/\(\s*closing time not (published|stated|given)\s*\)/gi, ""],
];

export function displayDescription(description: string): string {
  let value = description;
  for (const [pattern, replacement] of REWRITES) value = value.replace(pattern, replacement);
  // "To be safe, apply at least a day before the deadline to be safe." reads twice; keep one.
  value = value.replace(/To be safe, ([^.]*?) to be safe\./g, (_match, middle: string) => `To be safe, ${middle}.`);
  return value.replace(/\s{2,}/g, " ").replace(/\s+([.,;])/g, "$1").trim();
}
