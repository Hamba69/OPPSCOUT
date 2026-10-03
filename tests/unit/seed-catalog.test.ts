import { describe, expect, it } from "vitest";
import { getDiscoveredOpportunities, getDiscoveredOrganizations } from "@/data/discovered-catalog";

import {
  getSeedOpportunities,
  getSeedOrganizations,
  SEED_SNAPSHOT_AT,
} from "@/data/seed-catalog";

describe("current opportunity seed catalogue", () => {
  it("is bounded, current at its snapshot, and fully trust-reviewed", () => {
    const organizations = getSeedOrganizations();
    const opportunities = getSeedOpportunities();

    const discoveredOrganizations = getDiscoveredOrganizations();
    const discoveredOpportunities = getDiscoveredOpportunities();
    expect(organizations).toHaveLength(6 + discoveredOrganizations.length);
    expect(opportunities).toHaveLength(12 + discoveredOpportunities.length);
    expect(organizations.filter((organization) => organization.verificationStatus === "verified")).toHaveLength(6 + discoveredOrganizations.filter(o => o.verificationStatus === "verified").length);
    const reviewed = opportunities.filter((opportunity) => opportunity.verificationStatus === "verified");
    expect(reviewed).toHaveLength(12 + discoveredOpportunities.filter(o => o.verificationStatus === "verified").length);
    expect(new Set(organizations.map((organization) => organization.id)).size).toBe(organizations.length);
    expect(new Set(opportunities.map((opportunity) => opportunity.id)).size).toBe(opportunities.length);

    for (const opportunity of reviewed.filter(o => !discoveredOpportunities.some(d => d.id === o.id))) {
      expect(opportunity.deadline.getTime()).toBeGreaterThan(SEED_SNAPSHOT_AT.getTime());
      expect(opportunity.sourceUrl).toMatch(/^https:\/\//);
      expect(opportunity.verificationStatus).toBe("verified");
      expect(opportunity.organization?.verificationStatus).toBe("verified");
      expect(opportunity.reviewedAt).not.toBeNull();
      expect(opportunity.reviewChecklist).toEqual({
        sourceAuthentic: true,
        noInappropriateFees: true,
        noSensitiveDataAsk: true,
        deadlinePlausible: true,
        duplicateChecked: true,
      });
    }

    // Archive claims stay outside the trusted catalog until independent review.
    for (const imported of discoveredOpportunities.filter(o => o.verificationStatus !== "verified")) {
      const opportunity = opportunities.find((item) => item.id === imported.id)!;
      expect(["pending", "flagged"]).toContain(opportunity.verificationStatus);
      expect(opportunity.verificationStatus).not.toBe("verified");
      expect(opportunity.reviewedAt).toBeNull();
      expect(opportunity.reviewChecklist.sourceAuthentic).toBe(false);
    }
  });

  it("contains no duplicate organization-title-deadline records", () => {
    const canonicalKeys = getSeedOpportunities().map((opportunity) => [
      opportunity.organizationId,
      opportunity.title.trim().toLowerCase(),
      opportunity.deadline.toISOString(),
    ].join("|"));

    expect(new Set(canonicalKeys).size).toBe(canonicalKeys.length);
  });
});
