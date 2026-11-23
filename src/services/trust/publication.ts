import { NotFoundError, ValidationError } from "@/core/errors/app-error";
import type { Opportunity, TrustChecklist } from "@/core/entities/domain";
import type { Repository } from "@/lib/repository/types";
import { CHECKLIST_KEYS } from "@/services/trust/checklist";
import { reviewOpportunity } from "@/services/trust/review";

export const PUBLICATION_ACTIONS = ["withdraw", "readmit"] as const;
export type PublicationAction = (typeof PUBLICATION_ACTIONS)[number];

/** A verified listing that is still in the catalogue (not removed) can be withdrawn. */
export function canWithdraw(opportunity: Pick<Opportunity, "verificationStatus" | "status">): boolean {
  return opportunity.verificationStatus === "verified" && opportunity.status !== "removed";
}

/** Flagged listings, and verified listings that were removed, can be brought back after a fresh check. */
export function canReadmit(opportunity: Pick<Opportunity, "verificationStatus" | "status">): boolean {
  return opportunity.verificationStatus === "flagged" || (opportunity.verificationStatus === "verified" && opportunity.status === "removed");
}

const day = (now: Date): string => now.toISOString().slice(0, 10);

/**
 * Takes a verified listing out of every feed. It is marked flagged and removed, the same state as a
 * rejection, so the seeding pipeline will not re-propose it. The reason is appended to the review notes.
 */
export async function withdrawOpportunity(repository: Repository, id: string, reviewerId: string, reason: string, now = new Date()): Promise<Opportunity> {
  const opportunity = await repository.getOpportunity(id);
  if (!opportunity) throw new NotFoundError("Opportunity");
  if (!canWithdraw(opportunity)) throw new ValidationError("Only a verified listing that is still in the catalogue can be withdrawn.");
  const note = `Withdrawn ${day(now)}: ${reason.trim()}.`;
  const keptChecklist = Object.fromEntries(CHECKLIST_KEYS.map((key) => [key, opportunity.reviewChecklist[key] === true])) as unknown as TrustChecklist;
  await repository.reviewOpportunity(id, {
    checklist: keptChecklist,
    approved: false,
    reviewerId,
    notes: [opportunity.reviewNotes?.trim(), note].filter(Boolean).join("\n"),
  });
  return repository.updateOpportunity(id, { status: "removed" });
}

/**
 * Brings a flagged or removed listing back. It goes through the same approval rules as a first review
 * (future closing date or rolling, public HTTPS link, verified publisher), so re-admitting can never
 * publish something a fresh review would refuse. The reviewer confirms they re-checked the source,
 * so the re-check clock restarts.
 */
export async function readmitOpportunity(repository: Repository, id: string, reviewerId: string, note: string | undefined, now = new Date()): Promise<Opportunity> {
  const opportunity = await repository.getOpportunity(id);
  if (!opportunity) throw new NotFoundError("Opportunity");
  if (!canReadmit(opportunity)) throw new ValidationError("Only a flagged or removed listing can be re-admitted.");
  const fullChecklist = Object.fromEntries(CHECKLIST_KEYS.map((key) => [key, true])) as unknown as TrustChecklist;
  await reviewOpportunity(repository, id, reviewerId, fullChecklist, true, `re-admitted${note?.trim() ? `: ${note.trim()}` : ""}`, now);
  return repository.updateOpportunity(id, { status: "open", checkedAt: now });
}
