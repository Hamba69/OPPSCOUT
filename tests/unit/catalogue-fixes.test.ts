import { describe, expect, it } from "vitest";

import type { Opportunity } from "@/core/entities/domain";
import { MemoryRepository } from "@/lib/repository/memory";
import { applyCatalogueFix, hiddenApprovedListings, recheckDueListings } from "@/services/admin/catalogue-fixes";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";

const DAY = 86_400_000;
const checklist = { sourceAuthentic: true, officialApplicationLink: true, eligibleForUgandans: true, noInappropriateFees: true, noSensitiveDataAsk: true, deadlinePlausible: true, duplicateChecked: true };

async function seed(repository: MemoryRepository, overrides: Partial<Opportunity>): Promise<Opportunity> {
  const now = Date.now();
  const created = await repository.createOpportunity({
    title: "Accounts Assistant", organizationId: null, organizationName: "Gulu Dairy Cooperative", category: "job", description: "Bookkeeping role.", eligibility: {},
    requiredSkills: [], preferredSkills: [], location: "Gulu", workMode: "onsite", deadline: new Date(now + 20 * DAY), applicationMethod: "Apply online",
    sourceUrl: "https://gulu-dairy.example/jobs/accounts", verificationStatus: "verified", source: "scraped", origin: "catalog", status: "open",
  } as never);
  return repository.updateOpportunity(created.id, overrides);
}

describe("catalogue fixes", () => {
  it("lists approved listings that are hidden, with the reason and the fix", async () => {
    const repository = new MemoryRepository();
    const named = await seed(repository, {});
    const unnamed = await seed(repository, { organizationName: null, sourceUrl: "https://gulu-dairy.example/jobs/clerk" });
    for (const listing of [named, unnamed]) await repository.reviewOpportunity(listing.id, { checklist, approved: true, reviewerId: "admin" });
    // A catalogue listing that names its provider is visible without a linked organisation record.
    expect(isUserVisibleOpportunity((await repository.getOpportunity(named.id))!)).toBe(true);
    const hidden = hiddenApprovedListings(await repository.listOpportunities());
    const item = hidden.find((entry) => entry.opportunity.id === unnamed.id)!;
    expect(item.reasons).toContain("No provider named or linked");
    expect(item.actions).toEqual(["send-to-review"]);
    expect(hidden.some((entry) => entry.opportunity.id === named.id)).toBe(false);
  });

  it("sends incompletely reviewed listings back to review and re-checks or removes live ones", async () => {
    const repository = new MemoryRepository();
    const listing = await seed(repository, {});
    expect((await applyCatalogueFix(repository, listing.id, "send-to-review")).verificationStatus).toBe("pending");
    const checkedAt = new Date("2026-11-16T09:00:00Z");
    expect((await applyCatalogueFix(repository, listing.id, "mark-checked", checkedAt)).checkedAt.toISOString()).toBe(checkedAt.toISOString());
    expect((await applyCatalogueFix(repository, listing.id, "remove")).status).toBe("removed");
  });

  it("flags live listings close to the 14-day re-check limit", async () => {
    const repository = new MemoryRepository();
    const listing = await seed(repository, {});
    const organization = await repository.createOrganization({ name: "Provider", sector: "x", officialLinks: [], officialEmail: null, registrationProof: null, accountableContact: null, accountableContacts: [], dashboardUsers: [] });
    await repository.updateOpportunity(listing.id, { organizationId: organization.id, checkedAt: new Date(Date.now() - 12 * DAY) });
    await repository.reviewOpportunity(listing.id, { checklist, approved: true, reviewerId: "admin" });
    const due = recheckDueListings(await repository.listOpportunities());
    expect(due.map((item) => item.opportunity.id)).toContain(listing.id);
  });
});
