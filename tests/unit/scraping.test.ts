import { afterEach, describe, expect, it, vi } from "vitest";
import type { OpportunityTextExtractor } from "@/services/ai/types";
import { DEMO_ORG_ID, MemoryRepository } from "@/lib/repository/memory";
import { MemoryShadowOpportunityStore } from "@/services/ingestion/scraping/memory-shadow-store";
import { getShadowValidationSnapshot } from "@/services/ingestion/scraping/metrics";
import { runShadowDiscovery } from "@/services/ingestion/scraping/pipeline";
import { runPermittedSourceDiscovery } from "@/services/ingestion/scraping/discovery";
import { queueCandidatesForAdminReview } from "@/services/ingestion/scraping/review-queue";

describe("scraper shadow mode", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("stores extracted candidates without writing live opportunities", async () => {
    const repository = new MemoryRepository(); const store = new MemoryShadowOpportunityStore(); const before = (await repository.listOpportunities()).length;
    const extractor: OpportunityTextExtractor = { extract: async () => ({ isOpportunity: true, title: "New Climate Fellowship", category: "fellowship", description: "A learning fellowship for climate data work in Ugandan communities.", eligibility: { educationLevels: ["bachelors"] }, requiredSkills: ["research"], preferredSkills: ["data analysis"], location: "Kampala", workMode: "hybrid", deadline: new Date(Date.now() + 30 * 86_400_000).toISOString(), applicationMethod: "Apply on the official page", applicationUrl: "https://employer.example/apply" }) };
    await runShadowDiscovery({ sourceUrl: "https://official.example/fellowship", organizationId: DEMO_ORG_ID }, repository, extractor, store, async () => new Response('<html><body>Official opportunity <a href="https://employer.example/apply">Apply</a></body></html>'));
    expect((await repository.listOpportunities()).length).toBe(before); expect((await store.list())).toHaveLength(1);
    expect((await getShadowValidationSnapshot(store)).liveOpportunityWrites).toBe(0);
  });

  it("does not trust an application URL that is absent from the source page", async () => {
    const extractor: OpportunityTextExtractor = {
      extract: async () => ({
        isOpportunity: true,
        title: "Climate Fellowship",
        category: "fellowship",
        description: "A climate fellowship based in Uganda.",
        eligibility: {},
        requiredSkills: [],
        preferredSkills: [],
        location: "Uganda",
        workMode: "remote",
        deadline: null,
        applicationMethod: "Apply online.",
        applicationUrl: "https://invented.example/apply",
      }),
    };
    const store = new MemoryShadowOpportunityStore();
    const candidate = await runShadowDiscovery(
      { sourceUrl: "https://official.example/fellowship", organizationId: DEMO_ORG_ID },
      new MemoryRepository(),
      extractor,
      store,
      async () => new Response("<html><body>Climate fellowship.</body></html>"),
    );

    expect(candidate.applicationUrl).toBeNull();
    expect(candidate.trustSignals).toContain("No explicit official application link was found; verify it manually.");
  });

  it("prunes expired shadow candidates", async () => {
    const repository = new MemoryRepository();
    const store = new MemoryShadowOpportunityStore();
    const extractor: OpportunityTextExtractor = {
      extract: async () => ({
        isOpportunity: true,
        title: "Climate Fellowship",
        category: "fellowship",
        description: "A climate fellowship based in Uganda.",
        eligibility: {},
        requiredSkills: [],
        preferredSkills: [],
        location: "Uganda",
        workMode: "remote",
        deadline: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        applicationMethod: "Apply online.",
        applicationUrl: null,
      }),
    };
    await runShadowDiscovery(
      { sourceUrl: "https://official.example/fellowship", organizationId: null },
      repository,
      extractor,
      store,
      async () => new Response("<html><body>Climate fellowship.</body></html>"),
    );

    expect(await store.prune(new Date(Date.now() + 31 * 86_400_000))).toBe(1);
    expect(await store.list()).toHaveLength(0);
  });

  it("queues complete weekly discoveries for admin review without verifying them", async () => {
    const repository = new MemoryRepository();
    const store = new MemoryShadowOpportunityStore();
    const extractor: OpportunityTextExtractor = {
      extract: async () => ({
        isOpportunity: true,
        title: "Climate Fellowship for Uganda",
        category: "fellowship",
        description: "A climate fellowship supporting research in Ugandan communities.",
        eligibility: {},
        requiredSkills: ["research"],
        preferredSkills: [],
        location: "Uganda",
        workMode: "remote",
        deadline: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        applicationMethod: "Apply through the official portal.",
        applicationUrl: "https://example.org/apply",
      }),
    };
    const candidate = await runShadowDiscovery(
      { sourceUrl: "https://official.example/fellowship", organizationId: null },
      repository,
      extractor,
      store,
      async () => new Response('<html><body>Climate fellowship <a href="https://example.org/apply">Apply</a></body></html>'),
    );

    expect(await queueCandidatesForAdminReview(repository, [candidate])).toEqual({ queued: 1, duplicates: 0, needsReview: 0 });
    const queued = (await repository.listReviewQueue()).find((item) => item.title === "Climate Fellowship for Uganda");
    expect(queued?.verificationStatus).toBe("pending");
    expect(queued?.status).toBe("open");
    expect(await queueCandidatesForAdminReview(repository, [candidate])).toEqual({ queued: 0, duplicates: 1, needsReview: 0 });
  });

  it("crawls only allowlisted sitemap pages permitted by robots.txt", async () => {
    vi.stubEnv("OPPSCOUT_SCRAPER_ALLOWED_HOSTS", "jobadverts.co.ke");
    const repository = new MemoryRepository();
    const store = new MemoryShadowOpportunityStore();
    const extractor: OpportunityTextExtractor = {
      extract: async () => ({
        isOpportunity: true,
        title: "Climate Research Fellowship",
        category: "fellowship",
        description: "A climate research fellowship based in Kampala.",
        eligibility: {},
        requiredSkills: ["research"],
        preferredSkills: [],
        location: "Kampala",
        workMode: "onsite",
        deadline: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        applicationMethod: "Apply through the employer portal.",
        applicationUrl: "https://employer.example/apply",
      }),
    };
    const visited: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      const url = String(input);
      visited.push(url);
      if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nDisallow: /private\nSitemap: https://jobadverts.co.ke/sitemap.xml");
      if (url.endsWith("/sitemap.xml")) return new Response("<urlset><url><loc>https://jobadverts.co.ke/jobs/climate-fellowship/</loc></url><url><loc>https://jobadverts.co.ke/private/hidden/</loc></url><url><loc>https://jobadverts.co.ke/jobs/research-assistant/</loc></url></urlset>");
      return new Response('<html><body>Fellowship <a href="https://employer.example/apply">Apply</a></body></html>');
    };

    const result = await runPermittedSourceDiscovery({
      sourceUrl: "https://jobadverts.co.ke/",
      organizationId: DEMO_ORG_ID,
      startAt: 0,
      pageLimit: 1,
    }, repository, extractor, store, fetcher, async () => {});

    expect(result.discoveredPages).toBe(2);
    expect(result.processedPages).toBe(1);
    expect(result.nextStartAt).toBe(1);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.applicationUrl).toBe("https://employer.example/apply");
    expect(visited).not.toContain("https://jobadverts.co.ke/private/hidden/");
    expect(await repository.listOpportunities()).toHaveLength(10);
  });

  it("wraps weekly page batches around the sitemap instead of rescanning its first pages", async () => {
    vi.stubEnv("OPPSCOUT_SCRAPER_ALLOWED_HOSTS", "jobadverts.co.ke");
    const visited: string[] = [];
    const fetcher: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nSitemap: https://jobadverts.co.ke/sitemap.xml");
      if (url.endsWith("/sitemap.xml")) {
        return new Response("<urlset><url><loc>https://jobadverts.co.ke/one</loc></url><url><loc>https://jobadverts.co.ke/two</loc></url><url><loc>https://jobadverts.co.ke/three</loc></url></urlset>");
      }
      visited.push(url);
      return new Response("<html><body>Not an opportunity</body></html>");
    };
    const dependencies = [
      new MemoryRepository(),
      { extract: async () => ({ isOpportunity: false as const }) },
      new MemoryShadowOpportunityStore(),
      fetcher,
      async () => {},
    ] as const;
    const input = {
      sourceUrl: "https://jobadverts.co.ke/",
      organizationId: null,
      pageLimit: 2,
    };

    await runPermittedSourceDiscovery({ ...input, startAt: 0 }, ...dependencies);
    await runPermittedSourceDiscovery({ ...input, startAt: 2 }, ...dependencies);

    expect(visited).toEqual([
      "https://jobadverts.co.ke/one",
      "https://jobadverts.co.ke/two",
      "https://jobadverts.co.ke/three",
    ]);
  });

  it("refuses hosts unless explicitly allowlisted", async () => {
    vi.stubEnv("OPPSCOUT_SCRAPER_ALLOWED_HOSTS", "");
    const fetcher = vi.fn<typeof fetch>();
    await expect(runPermittedSourceDiscovery({
      sourceUrl: "https://ugjobnet.com/",
      organizationId: DEMO_ORG_ID,
      startAt: 0,
      pageLimit: 1,
    }, new MemoryRepository(), { extract: async () => { throw new Error("not called"); } }, new MemoryShadowOpportunityStore(), fetcher, async () => {}))
      .rejects.toMatchObject({ code: "SOURCE_NOT_PERMITTED" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
