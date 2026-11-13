/**
 * Source tiers decide how much a place we found a listing may be trusted.
 *
 *  A  Official: the funder, employer, university or institution's own page. May be published.
 *  B  Aggregator or job board. Useful for discovery only; a listing found here must be traced
 *     to its official page, and that page (Tier A) becomes the record's source.
 *  C  Social media, forwards, blogs. A lead at best; never a source.
 *
 * What matters is the tier of the page the record was VERIFIED against (`sourceUrl`), not where
 * the lead came from. Leads are kept for provenance only.
 */
export type SourceTier = "A" | "B" | "C";
export type TierBasis = "known-official-suffix" | "declared-official-domain" | null;

export interface SourceClassification {
  tier: SourceTier;
  host: string | null;
  basis: TierBasis;
  /** True when the URL is a site root or bare section, not a page about one listing. */
  homepageOnly: boolean;
  reason: string;
}

const SOCIAL_HOSTS = [
  "facebook.com", "fb.com", "instagram.com", "x.com", "twitter.com", "t.me", "telegram.me", "whatsapp.com",
  "wa.me", "tiktok.com", "youtube.com", "youtu.be", "medium.com", "blogspot.com", "wordpress.com",
  "substack.com", "reddit.com", "pinterest.com",
];

const AGGREGATOR_HOSTS = [
  "linkedin.com", "indeed.com", "glassdoor.com", "brightermonday.co.ug", "brightermonday.com",
  "jobwebuganda.com", "ugandajobline.com", "fuzu.com", "myjobmag.com", "jobinrwanda.com", "reliefweb.int",
  "opportunitydesk.org", "opportunitiesforafricans.com", "scholarshipdb.net", "scholars4dev.com",
  "afterschoolafrica.com", "scholarshipsads.com", "youthop.com", "devex.com", "impactpool.org", "unjobs.org",
];

/** Hosts whose registry restricts who can hold them, so a match is trusted without a declared domain. */
const KNOWN_OFFICIAL_SUFFIXES = [".gov", ".go.ug", ".gov.ug", ".ac.ug", ".edu", ".ac.uk", ".gov.uk", ".edu.au", ".int", ".un.org"];

export function hostOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.hostname.toLowerCase().replace(/^www\./, "") : null;
  } catch {
    return null;
  }
}

export function hostMatches(host: string, domain: string): boolean {
  const target = domain.toLowerCase().replace(/^www\./, "");
  return host === target || host.endsWith(`.${target}`);
}

const matchesAny = (host: string, domains: readonly string[]) => domains.some((domain) => hostMatches(host, domain));
const hasOfficialSuffix = (host: string) => KNOWN_OFFICIAL_SUFFIXES.some((suffix) => host.endsWith(suffix) || host === suffix.slice(1));

function isHomepageOnly(url: string): boolean {
  try {
    const { pathname, search, hash } = new URL(url);
    const segments = pathname.split("/").filter(Boolean);
    return segments.length === 0 && !search && !hash;
  } catch {
    return false;
  }
}

export function classifySource(url: string, declaredOfficialDomain?: string | null): SourceClassification {
  const host = hostOf(url);
  if (!host) return { tier: "C", host: null, basis: null, homepageOnly: false, reason: "Not a public HTTPS URL." };
  const homepageOnly = isHomepageOnly(url);
  if (matchesAny(host, SOCIAL_HOSTS)) return { tier: "C", host, basis: null, homepageOnly, reason: "Social media or blog platform: a lead, never a source." };
  if (matchesAny(host, AGGREGATOR_HOSTS)) return { tier: "B", host, basis: null, homepageOnly, reason: "Aggregator or job board: trace the listing to the official page." };
  const declared = declaredOfficialDomain ? declaredOfficialDomain.toLowerCase().replace(/^www\./, "") : null;
  const declaredIsUsable = declared !== null && !matchesAny(declared, SOCIAL_HOSTS) && !matchesAny(declared, AGGREGATOR_HOSTS);
  if (declaredIsUsable && hostMatches(host, declared)) {
    return { tier: "A", host, basis: hasOfficialSuffix(host) ? "known-official-suffix" : "declared-official-domain", homepageOnly, reason: "Host matches the organisation's official domain." };
  }
  if (hasOfficialSuffix(host)) {
    return { tier: "A", host, basis: "known-official-suffix", homepageOnly, reason: "Institutional domain." };
  }
  return { tier: "B", host, basis: null, homepageOnly, reason: "Unrecognised host that does not match the organisation's official domain: treated as unverified." };
}

/** How often a published listing must be re-verified. Vacancies close faster than scholarships. */
export function recheckIntervalDays(category: string): number {
  return ["job", "internship", "consultancy"].includes(category) ? 3 : 7;
}

export function isAggregatorHost(host: string): boolean {
  return matchesAny(host, AGGREGATOR_HOSTS);
}

export function isSocialHost(host: string): boolean {
  return matchesAny(host, SOCIAL_HOSTS);
}
