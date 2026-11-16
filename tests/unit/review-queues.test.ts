import { describe, expect, it } from "vitest";

import { MemoryRepository } from "@/lib/repository/memory";

describe("organization review queue", () => {
  it("removes a flagged organization from the active queue", async () => {
    const repository = new MemoryRepository();
    const organization = await repository.createOrganization({
      name: "Example Publisher",
      sector: "Education",
      officialLinks: ["https://example.org"],
      officialEmail: "careers@example.org",
      registrationProof: "REG-12345",
      accountableContact: "Amina Nakato",
      accountableContacts: [{ name: "Amina Nakato", phone: "+256700000000" }],
      dashboardUsers: [],
    });

    expect((await repository.listOrganizationReviewQueue()).map((item) => item.id)).toContain(organization.id);

    await repository.reviewOrganization(organization.id, false);

    expect((await repository.getOrganization(organization.id))?.verificationStatus).toBe("flagged");
    expect((await repository.listOrganizationReviewQueue()).map((item) => item.id)).not.toContain(organization.id);
  });
});
