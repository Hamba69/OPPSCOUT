import { describe, expect, it } from "vitest";

import { DISCOVERY_SOURCES } from "@/config/discovery-sources";
import { classifySource } from "@/services/seeding/source-tiers";

describe("discovery sources", () => {
  it.each(DISCOVERY_SOURCES.map((source) => [source.name, source] as const))("%s has the tier the pipeline will assign", (_name, source) => {
    expect(classifySource(source.url, source.officialDomain ?? null).tier).toBe(source.tier);
  });
  it("lists every source once, over HTTPS", () => {
    const urls = DISCOVERY_SOURCES.map((source) => source.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) expect(url.startsWith("https://")).toBe(true);
  });
  it("never lets a job board stand in as an official source", () => {
    expect(classifySource("https://www.greatugandajobs.com/job/123", "greatugandajobs.com").tier).toBe("B");
    expect(classifySource("https://p2p.windleuganda.org/opportunities/5", "windleuganda.org").tier).toBe("B");
    // Windle's own main site stays official for its own listings.
    expect(classifySource("https://windleuganda.org/careers/x", "windleuganda.org").tier).toBe("A");
  });
});
