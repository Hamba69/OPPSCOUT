import type { TrustChecklist } from "@/core/entities/domain";

export function checklistIsComplete(checklist: TrustChecklist): boolean {
  return ["sourceAuthentic", "noInappropriateFees", "noSensitiveDataAsk", "deadlinePlausible", "duplicateChecked"].every(key => checklist[key as keyof TrustChecklist] === true);
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
