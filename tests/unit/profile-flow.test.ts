import { describe, expect, it } from "vitest";

import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { buildRankedFeed, recomputeRankedFeed } from "@/services/matching/feed";

const NEW_USER_ID = "44444444-4444-4444-8444-444444444444";

describe("profile and match persistence flow", () => {
  it("creates a blank profile for a new user so wizard PATCH data is not seeded from the demo user", async () => {
    const repository = new MemoryRepository();
    const profile = await repository.createProfile(NEW_USER_ID, { name: "New user" });

    expect(profile.name).toBe("New user");
    expect(profile.skills).toEqual([]);
    expect(profile.location).toBeNull();
    expect(profile.profileCompletenessScore).toBe(0);
  });

  it("does not write matches for read-only feed builds but persists explicit recomputations", async () => {
    const repository = new MemoryRepository();

    const readOnly = await buildRankedFeed(repository, DEMO_USER_ID, new Date(), undefined, { persist: false });
    expect(readOnly.length).toBeGreaterThan(0);
    expect(await repository.listMatches(DEMO_USER_ID)).toHaveLength(0);

    await recomputeRankedFeed(repository, DEMO_USER_ID);
    expect((await repository.listMatches(DEMO_USER_ID)).length).toBe(readOnly.length);
  });
});
