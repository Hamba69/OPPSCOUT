import { describe, expect, it } from "vitest";

import { AppError } from "@/core/errors/app-error";
import { requireSameOrigin } from "@/lib/admin-portal";

describe("same-origin request validation", () => {
  it("accepts requests from the active site origin", () => {
    expect(() => requireSameOrigin(new Request("https://preview.example.com/api/v1/feedback", {
      headers: { origin: "https://preview.example.com" },
    }))).not.toThrow();
  });

  it("rejects cross-origin requests", () => {
    try {
      requireSameOrigin(new Request("https://oppscout.example.com/api/v1/feedback", {
        headers: { origin: "https://attacker.example" },
      }));
      throw new Error("Expected cross-origin request to be rejected.");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ status: 403, code: "ORIGIN_REQUIRED" });
    }
  });
});
