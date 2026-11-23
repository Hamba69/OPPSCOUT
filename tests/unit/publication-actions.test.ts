import { describe, expect, it } from "vitest";

import { PRIMARY_SEED_OPPORTUNITY_ID as ID } from "@/data/seed-catalog";
import { MemoryRepository } from "@/lib/repository/memory";
import { canReadmit, canWithdraw, readmitOpportunity, withdrawOpportunity } from "@/services/trust/publication";

const future = new Date(Date.now() + 30 * 86_400_000);

async function verifiedListing(): Promise<MemoryRepository> {
  const repository = new MemoryRepository();
  await repository.updateOpportunity(ID, { status: "open", verificationStatus: "verified", deadline: future, deadlineType: "fixed", sourceUrl: "https://example.org/job" });
  return repository;
}

describe("withdraw and re-admit", () => {
  it("withdrawing a verified listing flags and removes it, keeping the reason", async () => {
    const repository = await verifiedListing();
    const result = await withdrawOpportunity(repository, ID, "admin-portal", "Position filled early");
    expect(result.verificationStatus).toBe("flagged");
    expect(result.status).toBe("removed");
    expect(result.reviewNotes).toMatch(/Withdrawn \d{4}-\d{2}-\d{2}: Position filled early\./);
  });

  it("re-admitting puts it back live with a full checklist and a fresh check date", async () => {
    const repository = await verifiedListing();
    await withdrawOpportunity(repository, ID, "admin-portal", "Mistake");
    const now = new Date();
    const result = await readmitOpportunity(repository, ID, "admin-portal", "Deadline confirmed", now);
    expect(result.verificationStatus).toBe("verified");
    expect(result.status).toBe("open");
    expect(result.checkedAt.getTime()).toBe(now.getTime());
    expect(Object.values(result.reviewChecklist).every(Boolean)).toBe(true);
    expect(result.reviewNotes).toMatch(/approved \(re-admitted: Deadline confirmed\)/);
  });

  it("refuses to re-admit a listing whose deadline has passed", async () => {
    const repository = await verifiedListing();
    await repository.updateOpportunity(ID, { verificationStatus: "flagged", status: "removed", deadline: new Date("2020-01-01T00:00:00Z") });
    await expect(readmitOpportunity(repository, ID, "admin-portal", undefined)).rejects.toThrow(/future closing date/);
  });

  it("only allows the action that fits the listing's state", async () => {
    expect(canWithdraw({ verificationStatus: "verified", status: "open" })).toBe(true);
    expect(canWithdraw({ verificationStatus: "verified", status: "removed" })).toBe(false);
    expect(canWithdraw({ verificationStatus: "pending", status: "open" })).toBe(false);
    expect(canReadmit({ verificationStatus: "flagged", status: "removed" })).toBe(true);
    expect(canReadmit({ verificationStatus: "verified", status: "removed" })).toBe(true);
    expect(canReadmit({ verificationStatus: "verified", status: "open" })).toBe(false);
    const repository = await verifiedListing();
    await expect(readmitOpportunity(repository, ID, "admin-portal", undefined)).rejects.toThrow(/Only a flagged or removed/);
  });
});
