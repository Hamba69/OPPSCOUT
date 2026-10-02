import type { Opportunity, Organization, TrustChecklist } from "@/core/entities/domain";
import { containsSuspiciousRequest } from "@/services/trust/checklist";
import {
  getDiscoveredOpportunities as getArchiveOpportunities,
  getDiscoveredOrganizations as getArchiveOrganizations,
  ORG_ID,
  SEED_SNAPSHOT_AT as ARCHIVE_SNAPSHOT_AT,
} from "../../imports/external-opportunities-intake/discovered-catalog";

export const DISCOVERED_SNAPSHOT_AT = ARCHIVE_SNAPSHOT_AT;
export const SEED_SNAPSHOT_AT = ARCHIVE_SNAPSHOT_AT;

const aggregatorHosts = new Set([
  "advance-africa.com",
  "unjobnet.org",
  "opportunitiesforafricans.com",
  "greatugandajobs.com",
  "alljobspo.com",
]);

const dalilangTerritoryIds = new Set(
  getArchiveOpportunities()
    .filter((opportunity) => opportunity.organizationId === ORG_ID.dalilang && opportunity.title.startsWith("Territory Field Sales Representative"))
    .map((opportunity) => opportunity.id),
);

function isAfnetFeeConcern(opportunity: Opportunity): boolean {
  return opportunity.organizationId === ORG_ID.afnet && opportunity.title === "AFNet Flexible Grant";
}

function checklistComplete(checklist: Partial<TrustChecklist> | undefined | null): boolean {
  if (!checklist) return false;
  return (
    checklist.sourceAuthentic === true &&
    checklist.noInappropriateFees === true &&
    checklist.noSensitiveDataAsk === true &&
    checklist.deadlinePlausible === true &&
    checklist.duplicateChecked === true
  );
}

/**
 * Organizations that already passed archive trust review stay verified.
 * Only force pending when the archive never completed a review checklist.
 */
export function getDiscoveredOrganizations(): Organization[] {
  return getArchiveOrganizations().map((organization) => {
    const afnetFix = organization.id === ORG_ID.afnet;
    const alreadyVerified = organization.verificationStatus === "verified";
    return {
      ...organization,
      officialLinks: afnetFix ? ["https://afwcnet.org/"] : organization.officialLinks,
      // Keep verified status from the archive when present; otherwise pending until trust-desk review.
      verificationStatus: alreadyVerified ? "verified" : "pending",
    };
  });
}

/**
 * Preserve archive verification for listings that already have a complete trust checklist
 * and no automated red flags. Everything else stays pending/flagged so users never see
 * unverified opportunities — but the verified pool becomes the full reviewed catalog
 * (jobs, scholarships, fellowships, grants, internships across Uganda and eligible programmes).
 */
export function getDiscoveredOpportunities(): Opportunity[] {
  const organizations = new Map(getArchiveOrganizations().map((organization) => [organization.id, organization]));
  const opportunities = getArchiveOpportunities();
  const sourceCounts = new Map<string, number>();

  for (const opportunity of opportunities) {
    sourceCounts.set(opportunity.sourceUrl, (sourceCounts.get(opportunity.sourceUrl) ?? 0) + 1);
  }

  return opportunities.map((opportunity) => {
    const organization = organizations.get(opportunity.organizationId);
    let sourceHost = "";
    try {
      sourceHost = new URL(opportunity.sourceUrl).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      sourceHost = "";
    }
    const organizationUsesAggregatorLink =
      organization?.officialLinks.some((link) => {
        try {
          const host = new URL(link).hostname.toLowerCase().replace(/^www\./, "");
          return aggregatorHosts.has(host) || host === "tinyurl.com";
        } catch {
          return false;
        }
      }) ?? false;
    const feeConcern = isAfnetFeeConcern(opportunity);
    const containsTrustSignal = containsSuspiciousRequest(
      `${opportunity.title} ${opportunity.description} ${opportunity.applicationMethod}`,
    );
    const unresolvedTerritoryPair = dalilangTerritoryIds.has(opportunity.id);
    const archiveVerified = opportunity.verificationStatus === "verified" && checklistComplete(opportunity.reviewChecklist);
    const hasRedFlag = feeConcern || containsTrustSignal || unresolvedTerritoryPair;

    // Keep the archive's completed review when there is no new red flag.
    if (archiveVerified && !hasRedFlag) {
      return {
        ...opportunity,
        sourceUrl: feeConcern ? "https://afwcnet.org/women-grants" : opportunity.sourceUrl,
        verificationStatus: "verified" as const,
        // Preserve checklist / notes / reviewer from the archive.
      };
    }

    const reviewNotes = [
      `Imported from the archive snapshot ${ARCHIVE_SNAPSHOT_AT.toISOString().slice(0, 10)}. Official source, deadline, fee and sensitive-data checks are awaiting the app's trust-desk review.`,
      aggregatorHosts.has(sourceHost) ? "The source is a third-party aggregator; confirm the listing on the organization's own site." : "",
      (sourceCounts.get(opportunity.sourceUrl) ?? 0) > 1 ? "This source URL is shared by multiple imported listings; confirm a listing-specific link." : "",
      organizationUsesAggregatorLink ? "The supplied organization link points to an aggregator or redirect; verify the organization's official site." : "",
      unresolvedTerritoryPair ? "The app's deduplication rule flags the sibling Dalilang territory listing; confirm the exact title and duty station before approval." : "",
      feeConcern ? "Flagged: the official AFNet grant page discloses a $25 processing fee." : "",
      containsTrustSignal ? "Flagged by the app's automated trust-signal scan." : "",
    ]
      .filter(Boolean)
      .join(" ");

    const reviewChecklist: TrustChecklist = {
      sourceAuthentic: false,
      noInappropriateFees: !feeConcern,
      noSensitiveDataAsk: !containsTrustSignal,
      deadlinePlausible: false,
      duplicateChecked: !unresolvedTerritoryPair,
    };

    return {
      ...opportunity,
      sourceUrl: feeConcern ? "https://afwcnet.org/women-grants" : opportunity.sourceUrl,
      verificationStatus: hasRedFlag ? ("flagged" as const) : ("pending" as const),
      reviewChecklist,
      reviewNotes,
      reviewerId: null,
      reviewedAt: null,
    };
  });
}
