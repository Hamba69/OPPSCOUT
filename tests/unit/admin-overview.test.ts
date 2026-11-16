import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import AdminSection from "@/app/(admin)/admin/[section]/page";
import type { Opportunity, Organization } from "@/core/entities/domain";
import { setRepositoryForTests } from "@/lib/repository";
import { MemoryRepository } from "@/lib/repository/memory";
import { isPublisherOrganization, summarizeCatalogue } from "@/services/admin/catalogue-summary";

vi.mock("@/lib/admin-portal", () => ({ requireAdminPortal: vi.fn(async () => undefined), requireAdminPortalApi: vi.fn() }));

const now = new Date("2026-11-16T09:00:00Z");
const day = 86_400_000;
const checklist = { sourceAuthentic: true, officialApplicationLink: true, eligibleForUgandans: true, noInappropriateFees: true, noSensitiveDataAsk: true, deadlinePlausible: true, duplicateChecked: true };
let n = 0;
function listing(overrides: Partial<Opportunity> = {}): Opportunity {
  n += 1;
  return {
    id: `o${n}`, title: `Listing ${n}`, organizationId: "org", organizationName: "Provider", category: "job", description: "d", eligibility: {}, requiredSkills: [], preferredSkills: [],
    location: "Kampala", workMode: "onsite", deadline: new Date(now.getTime() + 20 * day), applicationMethod: "a", sourceUrl: "https://example.org/job", verificationStatus: "verified",
    source: "scraped", origin: "catalog", publicationDate: new Date(now.getTime() - 3 * day), checkedAt: new Date(now.getTime() - day), status: "open", reviewChecklist: checklist,
    reviewNotes: null, reviewerId: "admin", reviewedAt: new Date(now.getTime() - 2 * day), ...overrides,
  };
}

describe("catalogue summary", () => {
  it("counts what is live, what closes soon, what needs attention and what is hidden", () => {
    const summary = summarizeCatalogue([
      listing(),
      listing({ category: "scholarship", deadline: new Date(now.getTime() + 2 * day) }),
      listing({ deadline: new Date(now.getTime() + 6 * day) }),
      listing({ checkedAt: new Date(now.getTime() - 12 * day) }),
      listing({ verificationStatus: "pending", reviewedAt: null }),
      listing({ verificationStatus: "flagged" }),
      listing({ organizationId: null }),
      listing({ deadline: new Date(now.getTime() - 2 * day) }),
      listing({ verificationStatus: "pending", reviewedAt: null, deadline: new Date(now.getTime() - day) }),
    ], now);
    expect(summary.live).toBe(4);
    expect(summary.liveByCategory).toEqual([{ category: "job", count: 3 }, { category: "scholarship", count: 1 }]);
    expect(summary.closingIn3Days).toBe(1);
    expect(summary.closingIn7Days).toBe(2);
    expect(summary.staleSoon).toBe(1);
    expect(summary.awaitingReview).toBe(1);
    expect(summary.reported).toBe(1);
    expect(summary.approvedButHidden).toBe(1);
    expect(summary.approvedButHiddenReason).toBe("no linked organisation");
    expect(summary.expiredLast7Days).toBe(1);
    expect(summary.closingSoon[0]!.daysLeft).toBe(2);
  });

  it("treats only organisations with a dashboard user as publishers", () => {
    expect(isPublisherOrganization({ dashboardUsers: ["user-1"] })).toBe(true);
    expect(isPublisherOrganization({ dashboardUsers: [] })).toBe(false);
  });
});

describe("admin pages", () => {
  let repository: MemoryRepository;
  beforeEach(() => { repository = new MemoryRepository(); setRepositoryForTests(repository); });
  afterEach(() => setRepositoryForTests(undefined));

  const render = async (section: string) => renderToStaticMarkup(await AdminSection({ params: Promise.resolve({ section }), searchParams: Promise.resolve({}) }));

  it("leads the overview with attention items and the catalogue, without platform-health clutter", async () => {
    const html = await render("overview");
    for (const text of ["Needs your attention", "Listings awaiting review", "Publishers to verify", "Live for seekers", "Closing in 7 days", "Live listings by type", "Closing next", "Total users"]) expect(html).toContain(text);
    for (const text of ["p95 API latency", "API error rate", "Matches generated", "Latest feedback", "User funnel"]) expect(html).not.toContain(text);
  });

  it("lists only organisations that signed up in the app on the Publishers page", async () => {
    const seeded = await repository.createOrganization({ name: "Seeded Provider Ltd", sector: "Opportunity provider", officialLinks: ["https://seeded.example"], officialEmail: null, registrationProof: null, accountableContact: null, dashboardUsers: [] } as unknown as Organization);
    const publisher = await repository.createOrganization({ name: "App Publisher Ltd", sector: "Education", officialLinks: ["https://publisher.example"], officialEmail: "jobs@publisher.example", registrationProof: null, accountableContact: null, dashboardUsers: ["user-123"] } as unknown as Organization);
    const html = await render("organizations");
    expect(html).toContain(publisher.name);
    expect(html).not.toContain(seeded.name);
  });
});
