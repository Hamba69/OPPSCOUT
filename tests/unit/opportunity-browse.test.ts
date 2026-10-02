import { afterEach, describe, expect, it } from "vitest";

import { browseOpportunities } from "@/lib/opportunity-browse";
import { MemoryRepository, DEMO_USER_ID } from "@/lib/repository/memory";
import { setRepositoryForTests } from "@/lib/repository";

afterEach(() => setRepositoryForTests(undefined));

describe("opportunity browsing", () => {
  it("shows open catalog entries awaiting review without exposing flagged or organization submissions", async () => {
    const repository = new MemoryRepository();
    setRepositoryForTests(repository);
    const listings = await repository.listOpportunities();
    const [pendingCatalog, pendingOrganization, flagged, closed, expired] = listings;
    await repository.updateOpportunity(pendingCatalog.id, { verificationStatus: "pending", origin: "catalog" });
    await repository.updateOpportunity(pendingOrganization.id, { verificationStatus: "pending", origin: "organization" });
    await repository.updateOpportunity(flagged.id, { verificationStatus: "flagged" });
    await repository.updateOpportunity(closed.id, { status: "closed" });
    await repository.updateOpportunity(expired.id, { deadline: new Date("2020-01-01") });

    const result = await browseOpportunities(DEMO_USER_ID, {}, new Date());
    const ids = result.items.map((item) => item.id);
    expect(ids).toContain(pendingCatalog.id);
    expect(ids).not.toContain(pendingOrganization.id);
    expect(ids).not.toContain(flagged.id);
    expect(ids).not.toContain(closed.id);
    expect(ids).not.toContain(expired.id);
    expect(result.items.find((item) => item.id === pendingCatalog.id)).toMatchObject({ verificationStatus: "pending", matchScore: null });
    expect(result.items[0].verificationStatus).toBe("verified");
  });
});
