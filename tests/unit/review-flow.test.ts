import { describe, expect, it } from "vitest";

import { evidenceLines } from "@/components/review-card";
import type { TrustChecklist } from "@/core/entities/domain";
import { PRIMARY_SEED_OPPORTUNITY_ID } from "@/data/seed-catalog";
import { MemoryRepository } from "@/lib/repository/memory";
import { reviewOpportunity } from "@/services/trust/review";

const all = (value: boolean): TrustChecklist => ({ sourceAuthentic: value, officialApplicationLink: value, eligibleForUgandans: value, noInappropriateFees: value, noSensitiveDataAsk: value, deadlinePlausible: value, duplicateChecked: value });

describe("daily review flow", () => {
  it("rejecting removes the listing from the queue and keeps the research evidence", async () => {
    const repository = new MemoryRepository();
    await repository.updateOpportunity(PRIMARY_SEED_OPPORTUNITY_ID, { verificationStatus: "pending", reviewNotes: 'Deadline evidence: "Applications close on 1 March 2027."' });
    const result = await reviewOpportunity(repository, PRIMARY_SEED_OPPORTUNITY_ID, "admin", all(false), false, "Looks like a recruiter, not the employer");
    expect(result.verificationStatus).toBe("flagged");
    expect(result.status).toBe("removed");
    expect(result.reviewNotes).toContain("Deadline evidence");
    expect(result.reviewNotes).toMatch(/rejected \(Looks like a recruiter/);
  });

  it("approves a rolling listing, which has no closing date", async () => {
    const repository = new MemoryRepository();
    await repository.updateOpportunity(PRIMARY_SEED_OPPORTUNITY_ID, { verificationStatus: "pending", deadline: null, deadlineType: "rolling" });
    const result = await reviewOpportunity(repository, PRIMARY_SEED_OPPORTUNITY_ID, "admin", all(true), true);
    expect(result.verificationStatus).toBe("verified");
  });

  it("still refuses a fixed listing whose deadline has passed", async () => {
    const repository = new MemoryRepository();
    await repository.updateOpportunity(PRIMARY_SEED_OPPORTUNITY_ID, { verificationStatus: "pending", deadline: new Date("2020-01-01T00:00:00Z") });
    await expect(reviewOpportunity(repository, PRIMARY_SEED_OPPORTUNITY_ID, "admin", all(true), true)).rejects.toThrow(/future closing date/);
  });

  it("shows the agent's quoted evidence on the review card", () => {
    const lines = evidenceLines('Seeded 2026-11-16 from https://example.org/job (retrieved 2026-11-16T04:10:00Z).\nDeadline evidence: "Closes 30 November 2026."\nUgandan eligibility (explicit): "Open to Ugandan nationals."');
    expect(lines.map((line) => line.label)).toEqual(["Source page, as researched", "Deadline, as the page says", "Uganda eligibility (explicit)"]);
  });
});
