import type { TrustChecklist } from "@/core/entities/domain";

/** Every key that must be true before a listing is shown to seekers. Single source of truth. */
export const CHECKLIST_KEYS = [
  "sourceAuthentic",
  "officialApplicationLink",
  "eligibleForUgandans",
  "noInappropriateFees",
  "noSensitiveDataAsk",
  "deadlinePlausible",
  "duplicateChecked",
] as const satisfies ReadonlyArray<keyof TrustChecklist>;

export function checklistIsComplete(checklist: Partial<TrustChecklist>): boolean {
  return CHECKLIST_KEYS.every((key) => checklist[key] === true);
}

/** Keys that are not yet true, for explaining why a record is held. */
export function missingChecklistKeys(checklist: Partial<TrustChecklist>): Array<keyof TrustChecklist> {
  return CHECKLIST_KEYS.filter((key) => checklist[key] !== true);
}

/**
 * Builds a complete checklist from explicit findings. Every key must be stated, so a
 * script can no longer approve a listing while silently leaving a key out (the cause of
 * the "verified but invisible" catalogue). Pass `false` for anything not established.
 */
export function buildReviewChecklist(findings: TrustChecklist): TrustChecklist {
  return Object.fromEntries(CHECKLIST_KEYS.map((key) => [key, findings[key] === true])) as unknown as TrustChecklist;
}

const SUSPICIOUS_PATTERNS = [
  /application fee/i,
  /send (money|payment)/i,
  /mobile money/i,
  /bank (account|pin)/i,
  /password/i,
  /national id.*before applying/i,
];

export function containsSuspiciousRequest(value: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(value));
}
