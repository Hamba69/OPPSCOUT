import { describe, expect, it } from "vitest";

import {
  getSeedOpportunities,
  getSeedOrganizations,
  SEED_SNAPSHOT_AT,
} from "@/data/seed-catalog";

describe("current opportunity seed catalogue", () => {
  it("is bounded, current at its snapshot, and fully trust-reviewed", () => {
    const organizations = getSeedOrganizations();
    const opportunities = getSeedOpportunities();

    expect(organizations).toHaveLength(6);
    expect(opportunities).toHaveLength(12);
    expect(new Set(organizations.map((organization) => organization.id)).size).toBe(organizations.length);
    expect(new Set(opportunities.map((opportunity) => opportunity.id)).size).toBe(opportunities.length);

    for (const opportunity of opportunities) {
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
