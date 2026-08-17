import { describe, expect, it } from "vitest";
import { DEMO_ORG_ID, DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { buildRankedFeed } from "@/services/matching/feed";
import { getMonetizationReadiness } from "@/services/monetization/readiness";
describe("monetization safety", () => {
  it("fails closed without legal and real-metric thresholds", async () => { const repository = new MemoryRepository(); const organization = (await repository.getOrganization(DEMO_ORG_ID))!; const readiness = await getMonetizationReadiness(repository, organization); expect(readiness.ready).toBe(false); expect(readiness.blockers.length).toBeGreaterThanOrEqual(3); expect(readiness.coreDiscoveryFree).toBe(true); });
  it("never restricts an unpaid user's discovery feed", async () => { const repository = new MemoryRepository(); const before = await buildRankedFeed(repository, DEMO_USER_ID); await repository.updateOrganizationMonetization(DEMO_ORG_ID, { subscriptionTier: "free", subscriptionStatus: "inactive", monetizationEnabled: false, promotedListingCredits: 0 }); const after = await buildRankedFeed(repository, DEMO_USER_ID); expect(after.map((item) => item.opportunityId)).toEqual(before.map((item) => item.opportunityId)); expect(after.length).toBeGreaterThan(0); });
});
