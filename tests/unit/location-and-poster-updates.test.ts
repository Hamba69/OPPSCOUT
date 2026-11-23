import { describe, expect, it, vi } from "vitest";

import { placeOf } from "@/data/uganda-locations";
import { PRIMARY_SEED_OPPORTUNITY_ID as ID } from "@/data/seed-catalog";
import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { locationSimilarity } from "@/services/matching/orbit/canonical";
import { scoreLocation } from "@/services/matching/rule-based/location";
import { notifyPoster, posterUpdateMessage } from "@/services/notifications/poster-updates";

describe("location matching", () => {
  it("reads the district out of however a listing writes its location", () => {
    expect(placeOf("Masindi District, Uganda")).toEqual({ kind: "district", name: "Masindi" });
    expect(placeOf("Kampala, Uganda (Hybrid)")).toEqual({ kind: "district", name: "Kampala" });
    expect(placeOf("Head Office, Kampala, Uganda")).toEqual({ kind: "district", name: "Kampala" });
    expect(placeOf("Namanve, Mukono, Uganda")).toEqual({ kind: "district", name: "Mukono" });
    expect(placeOf("Uganda (Town Not Confirmed)")).toEqual({ kind: "uganda" });
    expect(placeOf("Sub-Saharan Africa")).toEqual({ kind: "uganda" });
    expect(placeOf("Remote (Worldwide)")).toEqual({ kind: "remote" });
    expect(placeOf("Nairobi, Kenya")?.kind).toBe("other");
  });

  it("scores the same district, nearby districts and the same region", () => {
    expect(locationSimilarity("Gulu", "Gulu District, Uganda")).toBe(1);
    expect(locationSimilarity("Kampala", "Kampala, Uganda (Hybrid)")).toBe(1);
    expect(locationSimilarity("Gulu", "Uganda")).toBe(1);
    expect(locationSimilarity("Kampala", "Wakiso, Uganda")).toBe(0.85);
    expect(locationSimilarity("Gulu", "Lira, Uganda")).toBe(0.5);
    expect(locationSimilarity("Gulu", "Kampala, Uganda")).toBe(0);
    expect(locationSimilarity("Gulu", "Nairobi, Kenya")).toBe(0);
  });

  it("the simpler engine agrees", async () => {
    const repository = new MemoryRepository();
    const profile = { ...(await repository.getProfile(DEMO_USER_ID))!, location: "Gulu", preferredLocations: [] };
    const listing = (await repository.getOpportunity(ID))!;
    expect(scoreLocation(profile, { ...listing, workMode: "onsite", location: "Gulu District, Uganda" }).ratio).toBe(1);
    expect(scoreLocation(profile, { ...listing, workMode: "onsite", location: "Kampala, Uganda" }).ratio).toBe(0);
  });
});

describe("telling posters about review decisions", () => {
  const contact = { name: "Amina Nakato", email: "amina@example.org", phone: "+256700000001", relationship: "work_there" as const };

  it("writes a clear email for each decision, with the reviewer's note", () => {
    const listing = { id: "abc", title: "Data Fellowship" };
    expect(posterUpdateMessage("approved", listing, "Amina").subject).toMatch(/is live/);
    const rejected = posterUpdateMessage("rejected", listing, "Amina", "The link goes to a recruiter, not the employer.");
    expect(rejected.text).toMatch(/Note from our review team: The link goes to a recruiter/);
    expect(rejected.text).toMatch(/\/dashboard\/abc\/edit/);
    expect(posterUpdateMessage("withdrawn", listing, "Amina", "Position filled").subject).toMatch(/taken down/);
  });

  it("emails the poster, and skips catalogue listings", async () => {
    const repository = new MemoryRepository();
    const listing = (await repository.getOpportunity(ID))!;
    const send = vi.fn().mockResolvedValue(undefined);
    expect(await notifyPoster(repository, { ...listing, submittedBy: null, submitterContact: null }, "approved", null, send)).toEqual({ emailed: false });
    expect(send).not.toHaveBeenCalled();
    expect(await notifyPoster(repository, { ...listing, submittedBy: DEMO_USER_ID, submitterContact: contact }, "rejected", "Check the deadline", send)).toEqual({ emailed: true });
    expect(send).toHaveBeenCalledWith("amina@example.org", expect.stringMatching(/Changes needed/), expect.stringMatching(/Check the deadline/));
  });

  it("never blocks the decision when email fails", async () => {
    const repository = new MemoryRepository();
    const listing = (await repository.getOpportunity(ID))!;
    const send = vi.fn().mockRejectedValue(new Error("Email provider is not configured."));
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(notifyPoster(repository, { ...listing, submittedBy: DEMO_USER_ID, submitterContact: contact }, "approved", null, send)).resolves.toEqual({ emailed: false });
    quiet.mockRestore();
  });
});
