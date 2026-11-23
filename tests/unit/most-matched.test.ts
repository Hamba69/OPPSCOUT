import { describe, expect, it } from "vitest";

import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { buildRankedFeed } from "@/services/matching/feed";
import { isMatchScore } from "@/config/match-threshold";
import { mostMatchedOpportunities, rankMostMatched } from "@/services/matching/most-matched";

describe("most matched opportunities across OppScout", () => {
  it("ranks by how many people each listing suits, closing sooner first on ties, leaving out unmatched ones", async () => {
    const opportunities = (await new MemoryRepository().listOpportunities()).slice(0, 4);
    const [a, b, c, d] = opportunities.map((item, index) => ({ ...item, deadline: new Date(Date.UTC(2027, 0, 10 + index)) }));
    const counts = new Map([[a!.id, 3], [b!.id, 9], [c!.id, 3], [d!.id, 0]]);
    const ranked = rankMostMatched([a!, b!, c!, d!], counts, 5);
    expect(ranked.map((item) => [item.opportunity.id, item.seekers])).toEqual([[b!.id, 9], [a!.id, 3], [c!.id, 3]]);
    expect(rankMostMatched([a!, b!, c!], counts, 1)).toHaveLength(1);
  });

  it("counts every seeker whose own feed matches the listing, and returns counts only", async () => {
    const repository = new MemoryRepository();
    const now = new Date();
    const result = await mostMatchedOpportunities(repository, now, 5);
    const own = new Set((await buildRankedFeed(repository, DEMO_USER_ID, now, undefined, { persist: false, telemetry: false }))
      .filter((match) => isMatchScore(match.score)).map((match) => match.opportunityId));
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.seekers >= 1)).toBe(true);
    expect(result.some((item) => own.has(item.opportunity.id))).toBe(true);
    expect(Object.keys(result[0]!)).toEqual(["opportunity", "seekers"]);
  });
});
