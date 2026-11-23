import type { Opportunity } from "@/core/entities/domain";

/** What a seeker (or anyone browsing the catalogue) may see about a listing. */
export type PublicOpportunity = Omit<Opportunity, "reviewChecklist" | "reviewNotes" | "reviewerId" | "reviewedAt" | "source" | "origin" | "submittedBy" | "submitterContact" | "verificationStatus" | "organization"> & {
  organization?: { id: string; name: string };
};

/**
 * Strips moderation internals (review state, notes and evidence, the checklist, who reviewed it, how it
 * was sourced) and the poster's identity and contact details before a listing leaves the API for anyone
 * but an admin or the person who posted it. Review state is not shown: every listing a seeker can see has
 * already passed review, and an organisation's own account status says nothing about the listing.
 */
export function publicOpportunity(opportunity: Opportunity): PublicOpportunity {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { reviewChecklist, reviewNotes, reviewerId, reviewedAt, source, origin, submittedBy, submitterContact, verificationStatus, organization, ...visible } = opportunity;
  return { ...visible, ...(organization ? { organization: { id: organization.id, name: organization.name } } : {}) };
}
