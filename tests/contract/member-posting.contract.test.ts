import { beforeEach, describe, expect, it, vi } from "vitest";

import * as opportunitiesRoute from "@/app/api/v1/opportunities/route";
import * as opportunityRoute from "@/app/api/v1/opportunities/[id]/route";
import { getRepository, setRepositoryForTests } from "@/lib/repository";
import { DEMO_ORG_ID, DEMO_ORG_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { MAX_PENDING_POSTS_PER_MEMBER } from "@/services/ingestion/member-submission";
import { contactLinks, contactLogLines, logPosterContact } from "@/services/trust/poster-contact";
import { publicOpportunity } from "@/services/trust/public-opportunity";
import { reviewOpportunity } from "@/services/trust/review";
import { CHECKLIST_KEYS } from "@/services/trust/checklist";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";

vi.mock("@/lib/auth", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/auth")>(),
  requireAuth: async () => ({ userId: DEMO_ORG_USER_ID, role: "organization", organizationId: DEMO_ORG_ID }),
}));

const headers = { "Content-Type": "application/json" };
const send = (path: string, method: string, body?: unknown): Request => new Request(`http://localhost${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  setRepositoryForTests(new MemoryRepository());
});

describe("member posting", () => {
  const listing = {
    title: "Community Data Fellowship", organizationName: "Nile Innovation", category: "fellowship",
    description: "A six-month fellowship helping Ugandan communities turn local evidence into practical programmes.",
    eligibility: {}, requiredSkills: [], preferredSkills: [], location: "Kampala", workMode: "hybrid",
    applicationMethod: "Apply through the official form", sourceUrl: "https://nile.example.org/fellowship",
    submitterContact: { name: "Amina Nakato", email: "amina@example.org", phone: "0772 123456", relationship: "recruiting_for_them" },
  };

  it("anyone signed in can post without an organisation account; it waits for review", async () => {
    const response = await opportunitiesRoute.POST(send("/api/v1/opportunities", "POST", { ...listing, deadline: "" }));
    expect(response.status).toBe(201);
    const data = (await response.json()).data;
    expect(data).toMatchObject({ origin: "community", organizationId: null, organizationName: "Nile Innovation", verificationStatus: "pending", deadlineType: "rolling", submittedBy: DEMO_ORG_USER_ID });
    expect(data.submitterContact.phone).toBe("0772 123456");
  });

  it("needs contact details so a reviewer can reach the poster", async () => {
    const { submitterContact: _omit, ...withoutContact } = listing;
    void _omit;
    expect((await opportunitiesRoute.POST(send("/api/v1/opportunities", "POST", { ...withoutContact, deadline: "" }))).status).toBe(400);
    expect((await opportunitiesRoute.POST(send("/api/v1/opportunities", "POST", { ...listing, deadline: "", submitterContact: { ...listing.submitterContact, phone: "call me" } }))).status).toBe(400);
  });

  it("limits how many posts one person can have waiting for review", async () => {
    for (let index = 0; index < MAX_PENDING_POSTS_PER_MEMBER; index++) {
      expect((await opportunitiesRoute.POST(send("/api/v1/opportunities", "POST", { ...listing, title: `Community Data Fellowship ${index}`, deadline: "" }))).status).toBe(201);
    }
    expect((await opportunitiesRoute.POST(send("/api/v1/opportunities", "POST", { ...listing, title: "One too many", deadline: "" }))).status).toBe(429);
  });

  it("editing a listing that was sent back resubmits it for review", async () => {
    const created = (await (await opportunitiesRoute.POST(send("/api/v1/opportunities", "POST", { ...listing, deadline: new Date(Date.now() + 20 * 86_400_000).toISOString() }))).json()).data;
    await (await getRepository()).updateOpportunity(created.id, { verificationStatus: "flagged", status: "removed" });
    const response = await opportunityRoute.PATCH(send(`/api/v1/opportunities/${created.id}`, "PATCH", { title: "Community Data Fellowship 2027" }), params(created.id));
    const data = (await response.json()).data;
    expect(data.verificationStatus).toBe("pending");
    expect(data.status).toBe("open");
  });

  it("an approved member post is shown to seekers without the poster's details", async () => {
    const created = (await (await opportunitiesRoute.POST(send("/api/v1/opportunities", "POST", { ...listing, deadline: new Date(Date.now() + 20 * 86_400_000).toISOString() }))).json()).data;
    const repository = await getRepository();
    await reviewOpportunity(repository, created.id, "admin-portal", Object.fromEntries(CHECKLIST_KEYS.map((key) => [key, true])) as never, true);
    const live = await repository.getOpportunity(created.id);
    expect(isUserVisibleOpportunity(live!)).toBe(true);
    const shown = publicOpportunity(live!) as Record<string, unknown>;
    expect(shown).not.toHaveProperty("submitterContact");
    expect(shown).not.toHaveProperty("submittedBy");
  });

  it("reviewers can log contact with the poster, and get one-tap links", async () => {
    const created = (await (await opportunitiesRoute.POST(send("/api/v1/opportunities", "POST", { ...listing, deadline: "" }))).json()).data;
    const updated = await logPosterContact(await getRepository(), created.id, "whatsapp", "Confirmed the role is real", new Date("2026-11-23T09:00:00Z"));
    expect(contactLogLines(updated.reviewNotes)).toEqual(["Contacted poster 2026-11-23 on WhatsApp: Confirmed the role is real"]);
    expect(updated.verificationStatus).toBe("pending");
    const links = contactLinks(listing.submitterContact as never, listing.title);
    expect(links.whatsapp).toMatch(/^https:\/\/wa\.me\/256772123456\?text=/);
    expect(links.call).toBe("tel:0772123456");
    expect(links.email).toMatch(/^mailto:amina@example\.org\?subject=/);
  });
});
