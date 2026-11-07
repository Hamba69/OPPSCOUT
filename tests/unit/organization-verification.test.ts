import { describe, expect, it } from "vitest";

import { isPublicHttpsUrl, organizationEmailMatchesWebsite, organizationSubmissionSchema } from "@/lib/validation";

describe("publisher verification requirements", () => {
  it("accepts an organization email on the official website domain", () => {
    expect(organizationEmailMatchesWebsite("careers@example.org", ["https://www.example.org"])).toBe(true);
    expect(organizationEmailMatchesWebsite("hr@jobs.example.org", ["https://example.org"])).toBe(true);
  });

  it("rejects a free or unrelated email domain", () => {
    expect(organizationEmailMatchesWebsite("publisher@gmail.com", ["https://example.org"])).toBe(false);
    expect(organizationEmailMatchesWebsite("hr@example.org.evil.test", ["https://example.org"])).toBe(false);
  });

  it("only accepts public HTTPS websites without embedded credentials", () => {
    expect(isPublicHttpsUrl("https://example.org")).toBe(true);
    expect(isPublicHttpsUrl("http://example.org")).toBe(false);
    expect(isPublicHttpsUrl("https://user:pass@example.org")).toBe(false);
  });

  it("requires a URSB number and uploaded proof for publisher onboarding", () => {
    const submission = {
      name: "Example Organization",
      sector: "Education",
      officialLinks: ["https://example.org"],
      officialEmail: "careers@example.org",
      registrationProof: "80020001234567",
      registrationProofDocumentId: "123e4567-e89b-42d3-a456-426614174000",
      accountableContacts: [{ name: "Accountable Person", phone: "+256700000000" }],
    };
    expect(organizationSubmissionSchema.safeParse(submission).success).toBe(true);
    expect(organizationSubmissionSchema.safeParse({ ...submission, officialEmail: "publisher@gmail.com" }).success).toBe(false);
    expect(organizationSubmissionSchema.safeParse({ ...submission, registrationProofDocumentId: "" }).success).toBe(false);
  });
});
