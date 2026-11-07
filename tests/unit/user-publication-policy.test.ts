import { describe, expect, it } from "vitest";

import type { Opportunity, TrustChecklist } from "@/core/entities/domain";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";

const checklist: TrustChecklist = {
  sourceAuthentic: true,
  officialApplicationLink: true,
  eligibleForUgandans: true,
  noInappropriateFees: true,
  noSensitiveDataAsk: true,
  deadlinePlausible: true,
  duplicateChecked: true,
};

const now = new Date("2026-11-07T12:00:00.000Z");

function base(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "55555555-5555-4555-8555-555555555599",
    title: "Sample verified listing",
    organizationId: "44444444-4444-4444-8444-444444444499",
    organization: {
      id: "44444444-4444-4444-8444-444444444499",
      name: "Sample Org",
      verificationStatus: "pending",
    },
    category: "internship",
    description: "A sample listing for publication tests.",
    eligibility: {},
    requiredSkills: ["research"],
    preferredSkills: [],
    location: "Kampala",
    workMode: "hybrid",
    deadline: new Date("2026-12-31T12:00:00.000Z"),
    applicationMethod: "Apply on the official site.",
    sourceUrl: "https://example.org/apply",
    verificationStatus: "verified",
    source: "manual",
    origin: "catalog",
    publicationDate: new Date("2026-10-01T00:00:00.000Z"),
    checkedAt: now,
    status: "open",
    reviewChecklist: checklist,
    reviewNotes: "Reviewed for tests.",
    reviewerId: "22222222-2222-4222-8222-222222222222",
    reviewedAt: now,
    ...overrides,
  };
}

describe("isUserVisibleOpportunity", () => {
  it("shows catalog opportunities without requiring the linked organization to be publisher-verified", () => {
    expect(isUserVisibleOpportunity(base({ origin: "catalog" }), now)).toBe(true);
    expect(
      isUserVisibleOpportunity(
        base({
          origin: "catalog",
          organization: { id: "o", name: "Pending Org", verificationStatus: "pending" },
        }),
        now,
      ),
    ).toBe(true);
  });

  it("requires publisher organization verification only for organization-origin listings", () => {
    expect(
      isUserVisibleOpportunity(
        base({
          origin: "organization",
          organization: { id: "o", name: "Pending Org", verificationStatus: "pending" },
        }),
        now,
      ),
    ).toBe(false);
    expect(
      isUserVisibleOpportunity(
        base({
          origin: "organization",
          organization: { id: "o", name: "Verified Org", verificationStatus: "verified" },
        }),
        now,
      ),
    ).toBe(true);
  });

  it("still hides expired, incomplete, or unverified opportunities", () => {
    expect(isUserVisibleOpportunity(base({ deadline: new Date("2026-11-01T00:00:00.000Z") }), now)).toBe(false);
    expect(isUserVisibleOpportunity(base({ verificationStatus: "pending" }), now)).toBe(false);
    expect(isUserVisibleOpportunity(base({ reviewChecklist: { ...checklist, sourceAuthentic: false } }), now)).toBe(false);
    expect(isUserVisibleOpportunity(base({ reviewedAt: null }), now)).toBe(false);
    expect(isUserVisibleOpportunity(base({ status: "closed" }), now)).toBe(false);
  });
});
