import { beforeAll, describe, expect, it } from "vitest";

import * as profileRoute from "@/app/api/v1/profile/route";
import * as completenessRoute from "@/app/api/v1/profile/completeness/route";
import * as opportunitiesRoute from "@/app/api/v1/opportunities/route";
import * as opportunityRoute from "@/app/api/v1/opportunities/[id]/route";
import * as refreshRoute from "@/app/api/v1/opportunities/refresh/route";
import * as eventsRoute from "@/app/api/v1/opportunities/[id]/events/route";
import * as matchesRoute from "@/app/api/v1/matches/route";
import * as explanationRoute from "@/app/api/v1/matches/[id]/explanation/route";
import * as savedRoute from "@/app/api/v1/saved/route";
import * as savedItemRoute from "@/app/api/v1/saved/[id]/route";
import * as savedStatusRoute from "@/app/api/v1/saved/[id]/status/route";
import * as notificationsRoute from "@/app/api/v1/notifications/route";
import * as preferencesRoute from "@/app/api/v1/notifications/preferences/route";
import * as notificationRunRoute from "@/app/api/v1/notifications/run/route";
import * as organizationsRoute from "@/app/api/v1/organizations/route";
import * as analyticsRoute from "@/app/api/v1/organizations/[id]/analytics/route";
import * as organizationRoute from "@/app/api/v1/organizations/[id]/route";
import * as kpiRoute from "@/app/api/v1/monitoring/kpis/route";
import * as scrapingShadowRoute from "@/app/api/v1/ingestion/scraping/shadow/route";
import * as ussdCredentialsRoute from "@/app/api/v1/ussd/credentials/route";
import * as ussdSessionRoute from "@/app/api/v1/ussd/session/route";
import * as monetizationRoute from "@/app/api/v1/organizations/[id]/monetization/route";
import * as reportsRoute from "@/app/api/v1/reports/route";
import * as reviewRoute from "@/app/api/v1/reports/review/route";
import * as reviewItemRoute from "@/app/api/v1/reports/review/[id]/route";
import * as sloRoute from "@/app/api/v1/monitoring/slo/route";
import { setRepositoryForTests } from "@/lib/repository";
import { DEMO_ORG_ID, MemoryRepository } from "@/lib/repository/memory";

const opportunityId = "55555555-5555-4555-8555-555555555551";
const userHeaders = { "Content-Type": "application/json" };
const orgHeaders = { ...userHeaders, "x-oppscout-demo-role": "organization" };
const adminHeaders = { ...userHeaders, "x-oppscout-demo-role": "admin" };

function request(path: string, method = "GET", body?: unknown, headers: Record<string, string> = userHeaders): Request {
  return new Request(`http://localhost${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

async function data<T>(response: Response): Promise<T> {
  const body = await response.json() as { data: T };
  return body.data;
}

describe("every Phase 1 /api/v1 route", () => {
  beforeAll(() => setRepositoryForTests(new MemoryRepository()));

  it("supports profile CRUD and completeness", async () => {
    expect((await profileRoute.GET(request("/api/v1/profile"))).status).toBe(200);
    expect((await profileRoute.PATCH(request("/api/v1/profile", "PATCH", { location: "Entebbe" }))).status).toBe(200);
    expect((await completenessRoute.GET(request("/api/v1/profile/completeness"))).status).toBe(200);
  });

  it("supports verified opportunity reads, events, and organization-owned CRUD", async () => {
    expect((await opportunitiesRoute.GET(request("/api/v1/opportunities"))).status).toBe(200);
    expect((await opportunityRoute.GET(request(`/api/v1/opportunities/${opportunityId}`), { params: Promise.resolve({ id: opportunityId }) })).status).toBe(200);
    expect((await eventsRoute.POST(request(`/api/v1/opportunities/${opportunityId}/events`, "POST", { eventType: "view" }), { params: Promise.resolve({ id: opportunityId }) })).status).toBe(201);
    const createdResponse = await opportunitiesRoute.POST(request("/api/v1/opportunities", "POST", {
      title: "Community Research Fellowship", organizationId: DEMO_ORG_ID, category: "fellowship",
      description: "A six-month fellowship helping Ugandan communities turn local evidence into practical programmes.",
      eligibility: { educationLevels: ["bachelors"] }, requiredSkills: ["research"], preferredSkills: [], location: "Kampala",
      workMode: "hybrid", deadline: new Date(Date.now() + 30 * 86_400_000).toISOString(), applicationMethod: "Apply through the official form",
      sourceUrl: "https://example.org/nile-innovation/fellowship", verificationStatus: "pending", source: "org_submitted", status: "open",
    }, orgHeaders));
    expect(createdResponse.status).toBe(201);
    const created = await data<{ id: string }>(createdResponse);
    expect((await opportunityRoute.PATCH(request(`/api/v1/opportunities/${created.id}`, "PATCH", { title: "Community Evidence Fellowship" }, orgHeaders), { params: Promise.resolve({ id: created.id }) })).status).toBe(200);
    expect((await opportunityRoute.DELETE(request(`/api/v1/opportunities/${created.id}`, "DELETE", undefined, orgHeaders), { params: Promise.resolve({ id: created.id }) })).status).toBe(204);
  });

  it("returns ranked matches with complete explanations", async () => {
    const response = await matchesRoute.GET(request("/api/v1/matches"));
    expect(response.status).toBe(200);
    const matches = await data<Array<{ id: string; matchedFactors: unknown[]; missingFactors: unknown[] }>>(response);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((match) => match.matchedFactors.length > 0 && match.missingFactors.length > 0)).toBe(true);
    expect((await explanationRoute.GET(request(`/api/v1/matches/${matches[0].id}/explanation`), { params: Promise.resolve({ id: matches[0].id }) })).status).toBe(200);
  });

  it("supports saved lifecycle and logs application intent", async () => {
    const response = await savedRoute.POST(request("/api/v1/saved", "POST", { opportunityId }));
    expect(response.status).toBe(201);
    const saved = await data<{ id: string }>(response);
    expect((await savedRoute.GET(request("/api/v1/saved"))).status).toBe(200);
    expect((await savedStatusRoute.PATCH(request(`/api/v1/saved/${saved.id}/status`, "PATCH", { status: "applied" }), { params: Promise.resolve({ id: saved.id }) })).status).toBe(200);
    expect((await savedItemRoute.DELETE(request(`/api/v1/saved/${saved.id}`, "DELETE"), { params: Promise.resolve({ id: saved.id }) })).status).toBe(204);
  });

  it("supports preferences, delivery runs, and notification history", async () => {
    expect((await preferencesRoute.GET(request("/api/v1/notifications/preferences"))).status).toBe(200);
    expect((await preferencesRoute.PATCH(request("/api/v1/notifications/preferences", "PATCH", { preferredChannel: "email", secondaryChannels: ["sms"], notificationsEnabled: true }))).status).toBe(200);
    expect((await notificationRunRoute.POST(request("/api/v1/notifications/run", "POST"))).status).toBe(200);
    expect((await notificationsRoute.GET(request("/api/v1/notifications"))).status).toBe(200);
  });

  it("creates organizations and returns aggregate-only analytics", async () => {
    expect((await organizationsRoute.POST(request("/api/v1/organizations", "POST", { name: "Bright Futures Uganda", sector: "Education", officialLinks: ["https://example.org/bright"], officialEmail: "hello@example.org", registrationProof: "REG-01", accountableContact: "Jane" }))).status).toBe(201);
    const response = await analyticsRoute.GET(request(`/api/v1/organizations/${DEMO_ORG_ID}/analytics`, "GET", undefined, orgHeaders), { params: Promise.resolve({ id: DEMO_ORG_ID }) });
    expect(response.status).toBe(200);
    expect(JSON.stringify(await response.json())).not.toMatch(/userId|email|phone/i);
    expect((await organizationRoute.GET(request(`/api/v1/organizations/${DEMO_ORG_ID}`, "GET", undefined, orgHeaders), { params: Promise.resolve({ id: DEMO_ORG_ID }) })).status).toBe(200);
    expect((await organizationRoute.PATCH(request(`/api/v1/organizations/${DEMO_ORG_ID}`, "PATCH", { sector: "Inclusive technology" }, orgHeaders), { params: Promise.resolve({ id: DEMO_ORG_ID }) })).status).toBe(200);
    const readiness = await monetizationRoute.GET(request(`/api/v1/organizations/${DEMO_ORG_ID}/monetization`, "GET", undefined, orgHeaders), { params: Promise.resolve({ id: DEMO_ORG_ID }) });
    expect(readiness.status).toBe(200); expect(JSON.stringify(await readiness.json())).not.toMatch(/userId|email|phone/i);
    expect((await monetizationRoute.PATCH(request(`/api/v1/organizations/${DEMO_ORG_ID}/monetization`, "PATCH", { subscriptionTier: "growth", monetizationEnabled: true }, adminHeaders), { params: Promise.resolve({ id: DEMO_ORG_ID }) })).status).toBe(409);
  });

  it("routes suspicious reports into the admin review queue and records decisions", async () => {
    expect((await reportsRoute.POST(request("/api/v1/reports", "POST", { opportunityId, reason: "Requests an application fee" }))).status).toBe(201);
    const queueResponse = await reviewRoute.GET(request("/api/v1/reports/review", "GET", undefined, adminHeaders));
    expect(queueResponse.status).toBe(200);
    const queue = await data<Array<{ id: string }>>(queueResponse);
    expect(queue.some((item) => item.id === opportunityId)).toBe(true);
    expect((await reviewItemRoute.PATCH(request(`/api/v1/reports/review/${opportunityId}`, "PATCH", { checklist: { sourceAuthentic: true, noInappropriateFees: true, noSensitiveDataAsk: true, deadlinePlausible: true, duplicateChecked: true }, approved: true, notes: "Confirmed" }, adminHeaders), { params: Promise.resolve({ id: opportunityId }) })).status).toBe(200);
  });

  it("serves the admin SLO snapshot and profile deletion route", async () => {
    expect((await sloRoute.GET(request("/api/v1/monitoring/slo", "GET", undefined, adminHeaders))).status).toBe(200);
    const kpis = await kpiRoute.GET(request("/api/v1/monitoring/kpis", "GET", undefined, adminHeaders));
    expect(kpis.status).toBe(200);
    expect((await data<{ metrics: unknown[] }>(kpis)).metrics).toHaveLength(10);
    expect((await scrapingShadowRoute.GET(request("/api/v1/ingestion/scraping/shadow", "GET", undefined, adminHeaders))).status).toBe(200);
    expect((await scrapingShadowRoute.POST(request("/api/v1/ingestion/scraping/shadow", "POST", { sourceUrl: "http://unsafe.example", organizationId: DEMO_ORG_ID }, adminHeaders))).status).toBe(422);
    expect((await ussdCredentialsRoute.POST(request("/api/v1/ussd/credentials", "POST", { userId: "11111111-1111-4111-8111-111111111111", pin: "1234" }, adminHeaders))).status).toBe(201);
    const ussdBody = new URLSearchParams({ sessionId: "contract-session", phoneNumber: "+256700000001", text: "" });
    const ussdResponse = await ussdSessionRoute.POST(new Request("http://localhost/api/v1/ussd/session", { method: "POST", body: ussdBody }));
    expect(ussdResponse.status).toBe(200); expect(await ussdResponse.text()).toMatch(/^CON /);
    expect((await refreshRoute.POST(request("/api/v1/opportunities/refresh", "POST", undefined, adminHeaders))).status).toBe(200);
    expect((await profileRoute.DELETE(request("/api/v1/profile", "DELETE"))).status).toBe(204);
  });
});
