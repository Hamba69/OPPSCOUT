export function deriveOfficialDomains(officialLinks: string[]): string[] {
  const domains = new Set<string>();

  for (const link of officialLinks) {
    let parsed: URL;
    try {
      parsed = new URL(link);
    } catch {
      throw new Error(`Invalid organization official link: ${link}`);
    }

    if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || !parsed.hostname) {
      throw new Error(`Invalid organization official link: ${link}`);
    }
    domains.add(parsed.hostname.toLowerCase());
  }

  return [...domains];
}
