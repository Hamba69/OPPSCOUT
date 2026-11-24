import { describe, expect, it } from "vitest";

import { loginReason } from "@/lib/login-reason";

describe("why someone is asked to log in", () => {
  it("explains it in terms of what they were trying to do", () => {
    expect(loginReason("/opportunities?type=job", true)).toMatch(/free account to browse opportunities/);
    expect(loginReason("/dashboard/new", true)).toMatch(/free account to post an opportunity/);
    expect(loginReason("/profile", true)).toMatch(/free account/);
    expect(loginReason("/saved", true)).toBe("Log in, or create a free account, to continue.");
  });

  it("says nothing extra on a plain visit to the login page", () => {
    expect(loginReason("/feed", false)).toBeNull();
  });
});
