import { INGESTION_RULES } from "@/config/ingestion-rules";
import type { Opportunity } from "@/core/entities/domain";
import { isPublicHttpsUrl } from "@/lib/validation";
import { missingChecklistKeys } from "@/services/trust/checklist";

/**
 * User-facing publication gate.
 *
 * Opportunity trust (verified + complete checklist + future deadline + official HTTPS source)
 * always applies.
 *
 * Organization verification is required only for publisher-submitted listings
 * (`origin === "organization"`). Catalog and staff-curated listings are trusted via
 * opportunity-level review; the linked organization does not need publisher verification
 * for seekers to see them.
 *
 * Publisher onboarding still requires verification before an organization can post
 * (see `publisherCanPost`).
 */

/**
 * Fixed listings need a future deadline. Rolling listings have no closing date, so they stay
 * visible only while they have been re-checked recently; an unchecked rolling listing is
 * treated like an expired one rather than being shown indefinitely.
 */
export function deadlineAllowsDisplay(opportunity: Opportunity, now: Date): boolean {
  if ((opportunity.deadlineType ?? "fixed") === "rolling") {
    const freshForMs = INGESTION_RULES.rollingFreshnessDays * 86_400_000;
    const recentlyChecked = now.getTime() - opportunity.checkedAt.getTime() <= freshForMs;
    return recentlyChecked && (opportunity.deadline === null || opportunity.deadline > now);
  }
  return opportunity.deadline !== null && opportunity.deadline > now;
}

/**
 * Every reason a listing is hidden from seekers; empty means visible. The funnel and health
 * reports use this so a catalogue that "looks verified" but shows nothing is explained, not guessed.
 */
export function visibilityFailures(opportunity: Opportunity, now = new Date()): string[] {
  const failures: string[] = [];
  const origin = opportunity.origin ?? "catalog";
  if (opportunity.verificationStatus !== "verified") failures.push(`verification status is ${opportunity.verificationStatus}`);
  // Catalogue listings may stand alone, named by `organizationName` (see the
  // allow_unlinked_catalog_opportunities migration). Publisher submissions must be linked.
  if (opportunity.organizationId === null && (origin === "organization" || !opportunity.organizationName?.trim())) failures.push("no linked organisation");
  if (origin === "organization" && opportunity.organization?.verificationStatus !== "verified") failures.push("publisher organisation is not verified");
  if (opportunity.reviewedAt === null) failures.push("not reviewed");
  if (opportunity.status !== "open" && opportunity.status !== "closing_soon") failures.push(`status is ${opportunity.status}`);
  if (!deadlineAllowsDisplay(opportunity, now)) {
    failures.push((opportunity.deadlineType ?? "fixed") === "rolling" ? "rolling listing has not been re-checked recently" : opportunity.deadline === null ? "no deadline" : "deadline has passed");
  }
  if (!isPublicHttpsUrl(opportunity.sourceUrl)) failures.push("source URL is not public HTTPS");
  const missing = missingChecklistKeys(opportunity.reviewChecklist);
  if (missing.length) failures.push(`checklist incomplete: ${missing.join(", ")}`);
  return failures;
}

export function isUserVisibleOpportunity(opportunity: Opportunity, now = new Date()): boolean {
  return visibilityFailures(opportunity, now).length === 0;
}

