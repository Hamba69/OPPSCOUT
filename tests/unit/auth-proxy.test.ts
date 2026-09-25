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
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe(path);
  });
  it("returns the response carrying refreshed cookies", async () => {
    const response = NextResponse.next();
    response.cookies.set("session-test", "refreshed");
    mocks.refreshSession.mockResolvedValue({ configured: true, user: { id: "test-user" }, response });
    expect(await proxy(new NextRequest("http://localhost:3000/feed"))).toBe(response);
  });
});
