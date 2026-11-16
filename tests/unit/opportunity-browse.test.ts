import { afterEach, describe, expect, it, vi } from "vitest";

import { browseOpportunities } from "@/lib/opportunity-browse";
import { MemoryRepository, DEMO_USER_ID } from "@/lib/repository/memory";
import { setRepositoryForTests } from "@/lib/repository";

afterEach(() => setRepositoryForTests(undefined));

describe("opportunity browsing", () => {
  it("does not fetch persisted match rows just to rank opportunities", async () => {
    const repository = new MemoryRepository();
    const listMatches = vi.spyOn(repository, "listMatches");
    setRepositoryForTests(repository);

    await browseOpportunities(DEMO_USER_ID, {}, new Date());

    expect(listMatches).not.toHaveBeenCalled();
  });

  it("only lists categories that have visible open opportunities in the database", async () => {
    const repository = new MemoryRepository();
    setRepositoryForTests(repository);

    const result = await browseOpportunities(DEMO_USER_ID, {}, new Date());
    const categoriesInItems = [...new Set(result.items.map((item) => item.category))].sort();

    expect([...result.categories].sort()).toEqual(categoriesInItems);
  });

  it("shows only approved, open listings: nothing awaiting review, flagged, closed or expired", async () => {
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
    expect(ids).not.toContain(pendingCatalog.id);
    expect(ids).not.toContain(pendingOrganization.id);
    expect(ids).not.toContain(flagged.id);
    expect(ids).not.toContain(closed.id);
    expect(ids).not.toContain(expired.id);
    expect(result.items[0].verificationStatus).toBe("verified");
  });
});
