import type { Opportunity } from "@/core/entities/domain";

/** What a seeker (or a publisher browsing the catalogue) may see about a listing. */
export type PublicOpportunity = Omit<Opportunity, "reviewChecklist" | "reviewNotes" | "reviewerId" | "reviewedAt" | "source" | "origin" | "submittedBy" | "submitterContact">;

/**
 * Strips moderation internals (review notes and evidence, the checklist, who reviewed it, how it was
 * sourced) and the poster's identity and contact details before a listing leaves the API for anyone but
 * an admin or the person who posted it.
 */
export function publicOpportunity(opportunity: Opportunity): PublicOpportunity {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { reviewChecklist, reviewNotes, reviewerId, reviewedAt, source, origin, submittedBy, submitterContact, ...visible } = opportunity;
  return visible;
}
