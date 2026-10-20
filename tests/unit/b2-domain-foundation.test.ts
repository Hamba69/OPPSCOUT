import { describe, expect, it } from "vitest";

import { FEATURE_FLAGS } from "@/config/feature-flags";
import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";

describe("B2 domain foundation", () => {
  it("applies conservative profile and organization defaults", async () => {
    const repository = new MemoryRepository();
    const profile = await repository.createProfile("44444444-4444-4444-8444-444444444444", { name: "New user" });
    expect(profile.countryOfResidence).toBe("UG");
    expect(profile.openToAbroad).toBe(false);

    const organization = await repository.createOrganization({
      name: "Example Foundation",
      sector: "education",
      officialLinks: ["https://www.example.org/about", "https://example.org/jobs"],
      officialEmail: null,
      registrationProof: null,
      accountableContact: null,
      dashboardUsers: [],
    });
    expect(organization.officialDomains).toEqual(["www.example.org", "example.org"]);
    expect(organization.trustedPoster).toBe(false);
    expect(organization.verifiedAt).toBeNull();
    expect(organization.verifiedBy).toBeNull();

    const updated = await repository.updateOrganization(organization.id, {
      officialLinks: ["https://careers.example.net/jobs"],
    });
    expect(updated.officialDomains).toEqual(["careers.example.net"]);
  });

  it("supports source, lead, listing-report, and ingestion-run CRUD", async () => {
    const repository = new MemoryRepository();
    const source = await repository.createSource({
      name: "Example careers page",
      kind: "careers_page",
      baseUrl: "https://example.org/careers",
    });
    expect(source.status).toBe("proposed");
    expect(source.crawlIntervalHours).toBe(24);
    expect(await repository.getSource(source.id)).toEqual(source);
    expect(await repository.listSources({ status: "proposed" })).toContainEqual(source);
    expect((await repository.updateSource(source.id, { status: "approved", consecutiveFailures: 2 })).status).toBe("approved");

    const lead = await repository.createLead({
      channel: "web",
      fingerprint: "example-lead-fingerprint",
      sourceId: source.id,
    });
    expect(lead.status).toBe("new");
    expect(lead.extracted).toEqual({});
    expect(await repository.getLead(lead.id)).toEqual(lead);
    expect(await repository.listLeads({ status: "new", sourceId: source.id })).toContainEqual(lead);
    expect((await repository.updateLead(lead.id, { status: "tracing", note: "Needs source verification" })).status).toBe("tracing");

    const opportunity = (await repository.listOpportunities())[0];
    const report = await repository.createListingReport({
      opportunityId: opportunity.id,
      reporterId: DEMO_USER_ID,
      reason: "expired",
    });
    expect(report.status).toBe("open");
    expect(await repository.getListingReport(report.id)).toEqual(report);
    expect(await repository.listListingReports({ status: "open", reporterId: DEMO_USER_ID })).toContainEqual(report);
    expect((await repository.updateListingReport(report.id, { status: "actioned" })).status).toBe("actioned");

    const run = await repository.createIngestionRun({ sourceId: source.id });
    expect(run.fetched).toBe(0);
    expect(run.errors).toEqual([]);
    expect(await repository.getIngestionRun(run.id)).toEqual(run);
    expect(await repository.listIngestionRuns({ sourceId: source.id })).toContainEqual(run);
    expect((await repository.updateIngestionRun(run.id, { fetched: 4, finishedAt: new Date() })).fetched).toBe(4);
  });

  it("keeps automated scraping and AI matching disabled by default", () => {
    expect(FEATURE_FLAGS.automatedScraping).toBe(false);
    expect(FEATURE_FLAGS.aiMatching).toBe(false);
  });
});
