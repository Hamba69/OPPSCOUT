import { describe, expect, it } from "vitest";

import { containsSuspiciousRequest } from "@/services/trust/checklist";

describe("trust screening", () => {
  it("flags inappropriate payment and financial credential requests", () => {
    expect(containsSuspiciousRequest("Send mobile money for the application fee")).toBe(true);
    expect(containsSuspiciousRequest("Share your bank PIN to continue")).toBe(true);
    expect(containsSuspiciousRequest("Apply free on our official HTTPS page")).toBe(false);
  });
});
