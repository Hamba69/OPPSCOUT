import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";

import FeedPage from "@/app/(web)/feed/page";
import CategoryMatchesPage from "@/app/(web)/feed/[category]/page";
import SavedPage from "@/app/(web)/saved/page";
import OpportunityPage from "@/app/(web)/opportunity/[id]/page";
import { GET as explainMatch } from "@/app/api/v1/matches/[id]/explanation/route";
import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { setRepositoryForTests } from "@/lib/repository";
import { requireSeekerProfile } from "@/lib/page-access";
import { buildRankedFeed } from "@/services/matching/feed";
import type { MatchResult } from "@/core/interfaces/match-engine";
import { requirePageAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile-store";

// Inject authenticated identity only; render the real pages, cards and engine.
vi.mock("@/lib/page-access", () => ({ requireSeekerProfile: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn(async () => ({ userId: "11111111-1111-4111-8111-111111111111", role: "user", organizationId: null })), requirePageAuth: vi.fn() }));
vi.mock("@/lib/profile-store", () => ({ getUserProfile: vi.fn() }));

describe("OrbitMatch route rendering", () => {
  let repository: MemoryRepository;

  beforeEach(async () => {
    vi.stubEnv("OPPSCOUT_AI_DEFAULT", "false");
    vi.stubEnv("OPPSCOUT_MATCH_ENGINE", undefined);
    repository = new MemoryRepository();
    setRepositoryForTests(repository);
    vi.mocked(requirePageAuth).mockResolvedValue({ userId: DEMO_USER_ID, role: "user", organizationId: null });
    vi.mocked(getUserProfile).mockResolvedValue((await repository.getProfile(DEMO_USER_ID))!);
    vi.mocked(requireSeekerProfile).mockResolvedValue({ userId: DEMO_USER_ID, profile: (await repository.getProfile(DEMO_USER_ID))! });
  });

  afterEach(() => {
    setRepositoryForTests(undefined);
    vi.unstubAllEnvs();
  });

  it("shows seekers only a bounded score, saves a card, and keeps the explanation server-side", async () => {
    const matches = await buildRankedFeed(repository, DEMO_USER_ID);
    expect(matches.length).toBeGreaterThan(0);
    // The Matches home is a briefing; its one button opens today's matches, where the cards are.
    const home = new JSDOM(renderToStaticMarkup(await FeedPage({ searchParams: Promise.resolve({}) })), { url: "http://localhost/" }).window.document;
    expect([...home.querySelectorAll("a")].find((a) => a.textContent?.includes("View today"))?.getAttribute("href")).toBe("/feed/all");
    expect(home.querySelectorAll("article")).toHaveLength(0);
    const feed = new JSDOM(renderToStaticMarkup(await CategoryMatchesPage({ params: Promise.resolve({ category: "all" }) })), { url: "http://localhost/" }).window.document;
    const cards = [...feed.querySelectorAll("article")];
    // Today's matches mounts its first page of cards; "Show more" reveals the rest.
    expect(cards).toHaveLength(Math.min(matches.length, 6));
    for (const [index, match] of matches.slice(0, cards.length).entries()) {
      expect(match.score).toBeGreaterThanOrEqual(0);
      expect(match.score).toBeLessThanOrEqual(100);
      expect(cards[index].querySelector(".score-block")?.textContent).toContain(`${match.score}%`);
      expect(cards[index].textContent).not.toContain("Why it fits");
      for (const factor of [...match.matchedFactors, ...match.missingFactors]) expect(cards[index].textContent).not.toContain(factor.detail);
    }

    const match = matches[0];
    await repository.saveOpportunity(DEMO_USER_ID, match.opportunityId);
    const saved = new JSDOM(renderToStaticMarkup(await SavedPage()), { url: "http://localhost/" }).window.document;
    expect(saved.querySelector("article h2")?.textContent).toBe(match.opportunity!.title);
    expect(saved.querySelector("article a")?.getAttribute("href")).toBe(`/opportunity/${match.opportunityId}`);

    const detail = new JSDOM(renderToStaticMarkup(await OpportunityPage({ params: Promise.resolve({ id: match.opportunityId }), searchParams: Promise.resolve({}) })), { url: "http://localhost/" }).window.document;
    expect(detail.querySelector("main")?.textContent).toContain(`${match.score}%`);
    expect([...detail.querySelectorAll("a")].find((a) => a.textContent?.includes("Back to opportunities"))?.getAttribute("href")).toBe("/opportunities");
    for (const factor of [...match.matchedFactors, ...match.missingFactors]) {
      expect(detail.querySelector("main")?.textContent).not.toContain(factor.detail);
    }
    const matchDetail = new JSDOM(renderToStaticMarkup(await OpportunityPage({ params: Promise.resolve({ id: match.opportunityId }), searchParams: Promise.resolve({ from: "matches" }) })), { url: "http://localhost/" }).window.document;
    expect([...matchDetail.querySelectorAll("a")].find((a) => a.textContent?.includes("Back to matches"))?.getAttribute("href")).toBe("/feed");
    const response = await explainMatch(new Request(`http://localhost/api/v1/matches/${match.id}/explanation`), { params: Promise.resolve({ id: match.id }) });
    expect(response.status).toBe(200);
    const { data } = await response.json() as { data: MatchResult };
    expect(data.score).toBe(match.score);
    expect(data.matchedFactors).toEqual(match.matchedFactors);
    expect(data.missingFactors).toEqual(match.missingFactors);
  });
});
