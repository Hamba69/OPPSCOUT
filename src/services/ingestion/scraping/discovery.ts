import { SCRAPING_RULES, SUPPORTED_SCRAPING_HOSTS } from "@/config/scraping-rules";
import { AppError } from "@/core/errors/app-error";
import type { Repository } from "@/lib/repository/types";
import type { OpportunityTextExtractor } from "@/services/ai/types";
import { runShadowDiscovery } from "@/services/ingestion/scraping/pipeline";
import type { ShadowCandidate, ShadowOpportunityStore } from "@/services/ingestion/scraping/types";

interface RobotsRule { allow: boolean; path: string; }
interface RobotsPolicy { rules: RobotsRule[]; sitemaps: string[]; crawlDelayMs: number; }
export interface SourceDiscoveryResult {
  sourceHost: string;
  sitemapCount: number;
  discoveredPages: number;
  processedPages: number;
  skippedPages: number;
  failedPages: Array<{ sourceUrl: string; code: string; message: string }>;
  nextStartAt: number | null;
  candidates: ShadowCandidate[];
}

function configuredHosts(): Set<string> {
  const configured = (process.env.OPPSCOUT_SCRAPER_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return new Set(configured.filter((host) => SUPPORTED_SCRAPING_HOSTS.includes(host as typeof SUPPORTED_SCRAPING_HOSTS[number])));
}

function assertPermittedUrl(value: string, expectedHost?: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AppError("A valid source URL is required.", 422, "INVALID_SOURCE");
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const allowedHosts = configuredHosts();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !allowedHosts.has(host) ||
    (expectedHost !== undefined && host !== expectedHost)
  ) {
    throw new AppError("This HTTPS source is not enabled for discovery.", 422, "SOURCE_NOT_PERMITTED");
  }
  return url;
}

function parseRobotsTxt(text: string): RobotsPolicy {
  const groups: Array<{ agents: string[]; rules: RobotsRule[]; crawlDelayMs: number }> = [];
  let current: { agents: string[]; rules: RobotsRule[]; crawlDelayMs: number } | null = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      if (!current || current.rules.length || current.crawlDelayMs) {
        current = { agents: [], rules: [], crawlDelayMs: 0 };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (current && (key === "allow" || key === "disallow") && value) {
      current.rules.push({ allow: key === "allow", path: value });
    } else if (current && key === "crawl-delay") {
      const seconds = Number(value);
      if (Number.isFinite(seconds) && seconds >= 0) current.crawlDelayMs = seconds * 1_000;
    }
  }
  const matchingGroups = groups.filter((group) => group.agents.some((agent) => agent === "*" || agent.includes("oppscoutbot")));
  const rules = matchingGroups.flatMap((group) => group.rules);
  const sitemaps = [...text.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((match) => match[1]);
  const crawlDelayMs = Math.max(SCRAPING_RULES.minimumCrawlDelayMs, ...matchingGroups.map((group) => group.crawlDelayMs));
  return { rules, sitemaps, crawlDelayMs };
}

function robotsAllows(url: URL, policy: RobotsPolicy): boolean {
  const path = `${url.pathname}${url.search}`;
  const matches = policy.rules
    .map((rule) => {
      const escaped = rule.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\$$/, "$");
      return { ...rule, specificity: rule.path.replace(/[*$]/g, "").length, matches: new RegExp(`^${escaped}`).test(path) };
    })
    .filter((rule) => rule.matches)
    .sort((a, b) => b.specificity - a.specificity || Number(b.allow) - Number(a.allow));
  return matches[0]?.allow ?? true;
}

function sitemapUrls(text: string): string[] {
  const values = [...text.matchAll(/<(?:loc|link)\b[^>]*>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/(?:loc|link)>/gi)]
    .map((match) => match[1].trim().replace(/&amp;/g, "&"));
  return [...new Set(values)];
}

function isSitemapUrl(url: URL): boolean {
  return /\.(?:xml|rss)$/i.test(url.pathname);
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchPermittedText(
  value: string,
  host: string,
  policy: RobotsPolicy,
  fetcher: typeof fetch,
  delay: (milliseconds: number) => Promise<void>,
  maximumBytes = SCRAPING_RULES.maximumDocumentBytes,
): Promise<string> {
  let url = assertPermittedUrl(value, host);
  if (!robotsAllows(url, policy)) throw new AppError("The page is disallowed by robots.txt.", 403, "ROBOTS_DISALLOWS_SOURCE");
  await delay(policy.crawlDelayMs);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetcher(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(SCRAPING_RULES.requestTimeoutMs),
      headers: { "user-agent": "OppScoutBot/1.0 (+opportunity-discovery)" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === 3) throw new AppError("Source redirect could not be followed safely.", 502, "SCRAPE_REDIRECT_ERROR");
      url = assertPermittedUrl(new URL(location, url).toString(), host);
      if (!robotsAllows(url, policy)) throw new AppError("The redirect destination is disallowed by robots.txt.", 403, "ROBOTS_DISALLOWS_SOURCE");
      continue;
    }
    if (!response.ok) throw new AppError(`Source returned ${response.status}.`, 502, "SCRAPE_SOURCE_ERROR");
    const text = await response.text();
    if (text.length > maximumBytes) {
      throw new AppError("The source document exceeds the configured size limit.", 413, "SCRAPE_DOCUMENT_TOO_LARGE");
    }
    return text;
  }
  throw new AppError("Too many source redirects.", 502, "SCRAPE_REDIRECT_ERROR");
}

export async function runPermittedSourceDiscovery(
  input: { sourceUrl: string; organizationId: string | null; startAt: number; pageLimit: number },
  repository: Repository,
  extractor: OpportunityTextExtractor,
  store: ShadowOpportunityStore,
  fetcher: typeof fetch = fetch,
  delay = wait,
): Promise<SourceDiscoveryResult> {
  const sourceUrl = assertPermittedUrl(input.sourceUrl);
  const host = sourceUrl.hostname.toLowerCase().replace(/\.$/, "");
  const robotsResponse = await fetcher(new URL("/robots.txt", sourceUrl.origin), {
    redirect: "error",
    signal: AbortSignal.timeout(SCRAPING_RULES.requestTimeoutMs),
    headers: { "user-agent": "OppScoutBot/1.0 (+opportunity-discovery)" },
  });
  if (!robotsResponse.ok) throw new AppError("Could not read the source robots.txt; discovery is disabled.", 403, "ROBOTS_UNAVAILABLE");
  const policy = parseRobotsTxt(await robotsResponse.text());
  const seedSitemaps = isSitemapUrl(sourceUrl)
    ? [sourceUrl.toString()]
    : policy.sitemaps;
  if (!seedSitemaps.length) throw new AppError("The source does not publish a sitemap in robots.txt.", 422, "SITEMAP_NOT_FOUND");

  const sitemapQueue = seedSitemaps.slice(0, SCRAPING_RULES.maximumSitemapsPerRun);
  const visitedSitemaps = new Set<string>();
  const pages = new Set<string>();
  while (sitemapQueue.length && visitedSitemaps.size < SCRAPING_RULES.maximumSitemapsPerRun) {
    const sitemap = assertPermittedUrl(sitemapQueue.shift()!, host);
    if (!isSitemapUrl(sitemap) || visitedSitemaps.has(sitemap.toString())) continue;
    visitedSitemaps.add(sitemap.toString());
    const xml = await fetchPermittedText(sitemap.toString(), host, policy, fetcher, delay, SCRAPING_RULES.maximumSitemapBytes);
    for (const entry of sitemapUrls(xml)) {
      if (pages.size >= SCRAPING_RULES.maximumDiscoveredPagesPerRun) break;
      let entryUrl: URL;
      try {
        entryUrl = assertPermittedUrl(new URL(entry, sitemap).toString(), host);
      } catch (error) {
        if (error instanceof AppError && error.code === "SOURCE_NOT_PERMITTED") continue;
        throw error;
      }
      if (isSitemapUrl(entryUrl)) {
        if (robotsAllows(entryUrl, policy) && !visitedSitemaps.has(entryUrl.toString()) && sitemapQueue.length < SCRAPING_RULES.maximumSitemapsPerRun) sitemapQueue.push(entryUrl.toString());
      } else if (robotsAllows(entryUrl, policy)) {
        pages.add(entryUrl.toString());
      }
    }
    if (pages.size >= SCRAPING_RULES.maximumDiscoveredPagesPerRun) break;
  }

  const pageUrls = [...pages];
  const selected = pageUrls.slice(input.startAt, input.startAt + input.pageLimit);
  const candidates: ShadowCandidate[] = [];
  let skippedPages = 0;
  const failedPages: SourceDiscoveryResult["failedPages"] = [];
  for (const pageUrl of selected) {
    try {
      const html = await fetchPermittedText(pageUrl, host, policy, fetcher, delay);
      candidates.push(await runShadowDiscovery(
        { sourceUrl: pageUrl, organizationId: input.organizationId },
        repository,
        extractor,
        store,
        async () => new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } }),
      ));
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_AN_OPPORTUNITY") {
        skippedPages += 1;
        continue;
      }
      if (error instanceof AppError) {
        failedPages.push({ sourceUrl: pageUrl, code: error.code, message: error.message });
        continue;
      }
      throw error;
    }
  }
  const nextStartAt = input.startAt + selected.length < pageUrls.length ? input.startAt + selected.length : null;
  return {
    sourceHost: host,
    sitemapCount: visitedSitemaps.size,
    discoveredPages: pageUrls.length,
    processedPages: selected.length,
    skippedPages,
    failedPages,
    nextStartAt,
    candidates,
  };
}
