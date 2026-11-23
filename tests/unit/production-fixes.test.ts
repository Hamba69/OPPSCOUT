import { describe, expect, it } from "vitest";

import * as catchAll from "@/app/api/[...path]/route";
import { soleManagedOrganizations } from "@/services/account/account-data";
import { publicOpportunity } from "@/services/trust/public-opportunity";
import { calculateProfileCompleteness, getMissingOptionalFields } from "@/services/profile/completeness";
import { profileNudge } from "@/services/profile/nudge";
import { getDemoCatalog } from "@/data/demo-catalog";

describe("unknown API addresses", () => {
  it("answer with a JSON 404 for every method", async () => {
    for (const method of ["GET", "POST", "PATCH", "DELETE"] as const) {
      const response = await catchAll[method]();
      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(await response.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
    }
  });
});

describe("seeker-facing listings", () => {
  it("never include moderation fields", () => {
    const listing = { ...getDemoCatalog().opportunities[0]!, reviewNotes: "Seeded from internal research", reviewerId: "admin-portal" };
    const visible = publicOpportunity(listing) as Record<string, unknown>;
    for (const key of ["reviewNotes", "reviewerId", "reviewChecklist", "reviewedAt", "source", "origin"]) expect(visible).not.toHaveProperty(key);
    expect(visible).toMatchObject({ id: listing.id, title: listing.title, deadline: listing.deadline, sourceUrl: listing.sourceUrl });
  });
});

describe("profile completeness", () => {
  it("the home card and the profile page show the same number", () => {
    const profile = { name: "Grace", email: "g@example.com", dateOfBirth: new Date("2001-05-14"), location: "Kampala", educationLevel: "bachelors", fieldOfStudy: "computer science", graduationStatus: "graduated", skills: ["sql"], languages: ["English"], opportunityCategories: ["job"], careerInterests: ["technology"], preferredLocations: ["Kampala"], workModePreference: "hybrid" as const, institution: null };
    const nudge = profileNudge(profile as never);
    expect(nudge?.completeness).toBe(calculateProfileCompleteness(profile as never));
    expect(nudge?.field).toBe("Institution");
    expect(getMissingOptionalFields(profile as never)).toContain("GitHub profile");
  });
});

describe("account deletion", () => {
  it("waits when the person is the only manager of an organisation", () => {
    const orgs = [
      { id: "a", name: "Solo Org", dashboardUsers: ["me"] },
      { id: "b", name: "Shared Org", dashboardUsers: ["me", "colleague"] },
      { id: "c", name: "Other Org", dashboardUsers: ["someone"] },
    ];
    expect(soleManagedOrganizations("me", orgs)).toEqual([{ id: "a", name: "Solo Org" }]);
    expect(soleManagedOrganizations("colleague", orgs)).toEqual([]);
  });
});
