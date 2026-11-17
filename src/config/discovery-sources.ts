/**
 * Where the catalogue owner looks for new listings. These are discovery sources, not record sources:
 * a listing found on a Tier B board must be traced to the organisation's own page, and that page becomes
 * the record's `sourceUrl` (see src/services/seeding/source-tiers.ts). A Tier A source here is the
 * organisation itself, so its own listing pages can be used directly.
 *
 * `tier` must agree with classifySource(); tests/unit/discovery-sources.test.ts enforces that.
 */
import type { OPPORTUNITY_TYPES } from "@/lib/opportunity-types";

type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export interface DiscoverySource {
  name: string;
  url: string;
  tier: "A" | "B";
  /** For Tier A: the organisation's official domain, as a candidate's organizationOfficialDomain would give it. */
  officialDomain?: string;
  categories: readonly OpportunityType[];
  note: string;
}

export const DISCOVERY_SOURCES: readonly DiscoverySource[] = [
  // Local jobs, graduate trainee roles and internships
  { name: "BrighterMonday Uganda", url: "https://www.brightermonday.co.ug/jobs", tier: "B", categories: ["job", "internship"], note: "Largest Ugandan job board; filters for internships and graduate trainee roles." },
  { name: "Great Uganda Jobs", url: "https://www.greatugandajobs.com/search-job/newest-jobs/category-internships-trainee-jobs-in-uganda-31", tier: "B", categories: ["job", "internship"], note: "Daily private-sector and NGO postings; internships and trainee category." },
  { name: "Fuzu Uganda", url: "https://www.fuzu.com/uganda", tier: "B", categories: ["job", "internship", "training"], note: "Corporate and startup roles." },
  { name: "Peak Pro Jobs", url: "https://peakprojobs.com/", tier: "B", categories: ["job", "internship"], note: "Graduate internships and statutory-body openings (URA, NSSF)." },
  // NGO jobs, RFPs and consultancies
  { name: "ReliefWeb Uganda", url: "https://reliefweb.int/jobs?list=Uganda%20Jobs&advanced-search=%28C240%29", tier: "B", categories: ["job", "consultancy"], note: "Humanitarian and development jobs and consultancies in Uganda." },
  { name: "Windle Uganda E2E Market Space", url: "https://p2p.windleuganda.org/opportunities", tier: "B", categories: ["consultancy", "internship", "grant"], note: "Contracts, placements and grants posted by other organisations." },
  // Grants, startup funding and fellowships
  { name: "StartupMapHub Uganda", url: "https://startupmaphub.com/funding/idea/uganda", tier: "B", categories: ["grant", "fellowship"], note: "Tracks grants and seed funding for Ugandan founders." },
  { name: "Innovation Village", url: "https://innovationvillage.africa/opportunities/", tier: "A", officialDomain: "innovationvillage.africa", categories: ["fellowship", "training", "grant", "consultancy"], note: "Kampala hub; runs its own accelerators, challenges and tenders. innovationvillage.co.ug redirects here." },
  { name: "Outbox", url: "https://outbox.co.ug/", tier: "A", officialDomain: "outbox.co.ug", categories: ["fellowship", "training", "grant"], note: "Kampala hub; runs its own programmes. Never use outboxhub.com: it is a parked domain for sale, not Outbox." },
  { name: "Hive Colab", url: "https://hivecolab.org/", tier: "A", officialDomain: "hivecolab.org", categories: ["fellowship", "training"], note: "Incubation programmes and sector fellowships." },
  { name: "Building Tomorrow Fellowship", url: "https://buildingtomorrow.org/fellowship-uganda/", tier: "A", officialDomain: "buildingtomorrow.org", categories: ["fellowship"], note: "Paid two-year fellowship for Ugandan graduates." },
  // Skills training and youth programmes
  { name: "Uganda Youth Skills Training Organization", url: "https://skillsforyouths.org/opportunities/", tier: "B", categories: ["training", "fellowship"], note: "Mostly reposts other organisations' programmes; trace each one." },
  { name: "FCA Talent Link Uganda", url: "https://fcatalentlink.com/opportunities", tier: "A", officialDomain: "fcatalentlink.com", categories: ["training", "scholarship", "internship"], note: "Finn Church Aid Uganda's own pathways site for refugee and host-community youth; listings load in the browser." },
  { name: "TotalEnergies Uganda", url: "https://totalenergies.ug/employment-training", tier: "A", officialDomain: "totalenergies.ug", categories: ["job", "internship", "training", "scholarship"], note: "Employer's own training, attachments and scholarships." },
];
