import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import proxy, { config } from "@/proxy";

const mocks = vi.hoisted(() => ({ refreshSession: vi.fn() }));
vi.mock("@/lib/supabase/proxy", () => ({ refreshSession: mocks.refreshSession }));
beforeEach(() => { vi.resetAllMocks(); });

describe("auth proxy", () => {
  it.each(config.matcher)("redirects signed-out protected route %s", async (matcher) => {
    mocks.refreshSession.mockResolvedValue({ configured: true, user: null });
    const path = matcher.replace("/:path*", "") + "?view=recent";
    const response = await proxy(new NextRequest(`http://localhost:3000${path}`));
    const location = new URL(response.headers.get("location")!);
    // Publisher areas send signed-out visitors to the publisher login; everything else to the seeker login.
    expect(location.pathname).toBe("/login"); // One sign-in for everyone; the publisher login is retired.
    expect(location.searchParams.get("next")).toBe(path);
  });
  it("returns the response carrying refreshed cookies", async () => {
    const response = NextResponse.next();
    response.cookies.set("session-test", "refreshed");
    mocks.refreshSession.mockResolvedValue({ configured: true, user: { id: "test-user", user_metadata: { dateOfBirth: "2000-03-01" } }, response });
    expect(await proxy(new NextRequest("http://localhost:3000/feed"))).toBe(response);
  });

  it.each([
    ["no date of birth", {}],
    ["a date of birth under 18", { dateOfBirth: `${new Date().getUTCFullYear() - 15}-01-01` }],
  ])("sends a signed-in account with %s to confirm their age first", async (_label, metadata) => {
    mocks.refreshSession.mockResolvedValue({ configured: true, user: { id: "test-user", user_metadata: metadata }, response: NextResponse.next() });
    const location = new URL((await proxy(new NextRequest("http://localhost:3000/dashboard/new"))).headers.get("location")!);
    expect(location.pathname).toBe("/confirm-age");
    expect(location.searchParams.get("next")).toBe("/dashboard/new");
  });

  it("lets reviewers through without a date of birth", async () => {
    const response = NextResponse.next();
    mocks.refreshSession.mockResolvedValue({ configured: true, user: { id: "admin", app_metadata: { role: "admin" } }, response });
    expect(await proxy(new NextRequest("http://localhost:3000/feed"))).toBe(response);
  });
});
