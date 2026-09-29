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

export function getDiscoveredOrganizations(): Organization[] {
  return getArchiveOrganizations().map((organization) => ({
    ...organization,
    officialLinks: organization.id === ORG_ID.afnet ? ["https://afwcnet.org/"] : organization.officialLinks,
    verificationStatus: "pending",
  }));
}

export function getDiscoveredOpportunities(): Opportunity[] {
  const organizations = new Map(getArchiveOrganizations().map((organization) => [organization.id, organization]));
  const opportunities = getArchiveOpportunities();
  const sourceCounts = new Map<string, number>();

  for (const opportunity of opportunities) {
    sourceCounts.set(opportunity.sourceUrl, (sourceCounts.get(opportunity.sourceUrl) ?? 0) + 1);
  }

  return opportunities.map((opportunity) => {
    const organization = organizations.get(opportunity.organizationId);
    const sourceHost = new URL(opportunity.sourceUrl).hostname.toLowerCase().replace(/^www\./, "");
    const organizationUsesAggregatorLink = organization?.officialLinks.some((link) => {
      const host = new URL(link).hostname.toLowerCase().replace(/^www\./, "");
      return aggregatorHosts.has(host) || host === "tinyurl.com";
    }) ?? false;
    const feeConcern = isAfnetFeeConcern(opportunity);
    const containsTrustSignal = containsSuspiciousRequest(
      `${opportunity.title} ${opportunity.description} ${opportunity.applicationMethod}`,
    );
    const unresolvedTerritoryPair = dalilangTerritoryIds.has(opportunity.id);
    const reviewNotes = [
      `Imported from the archive snapshot ${ARCHIVE_SNAPSHOT_AT.toISOString().slice(0, 10)}. Official source, deadline, fee and sensitive-data checks are awaiting the app's trust-desk review.`,
      aggregatorHosts.has(sourceHost) ? "The source is a third-party aggregator; confirm the listing on the organization's own site." : "",
      (sourceCounts.get(opportunity.sourceUrl) ?? 0) > 1 ? "This source URL is shared by multiple imported listings; confirm a listing-specific link." : "",
      organizationUsesAggregatorLink ? "The supplied organization link points to an aggregator or redirect; verify the organization's official site." : "",
      unresolvedTerritoryPair ? "The app's deduplication rule flags the sibling Dalilang territory listing; confirm the exact title and duty station before approval." : "",
      feeConcern ? "Flagged: the official AFNet grant page discloses a $25 processing fee." : "",
      containsTrustSignal ? "Flagged by the app's automated trust-signal scan." : "",
    ].filter(Boolean).join(" ");
    const reviewChecklist: TrustChecklist = {
      sourceAuthentic: false,
      noInappropriateFees: false,
      noSensitiveDataAsk: false,
      deadlinePlausible: false,
      duplicateChecked: !unresolvedTerritoryPair,
    };

    return {
      ...opportunity,
      sourceUrl: feeConcern ? "https://afwcnet.org/women-grants" : opportunity.sourceUrl,
      verificationStatus: feeConcern || containsTrustSignal ? "flagged" : "pending",
      reviewChecklist,
      reviewNotes,
      reviewerId: null,
      reviewedAt: null,
    };
  });
}