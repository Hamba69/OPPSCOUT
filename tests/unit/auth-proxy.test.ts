import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import proxy, { config } from "@/proxy";

const mocks = vi.hoisted(() => ({ isMemoryDataMode: vi.fn(), refreshSession: vi.fn() }));
vi.mock("@/lib/repository", () => ({ isMemoryDataMode: mocks.isMemoryDataMode }));
vi.mock("@/lib/supabase/proxy", () => ({ refreshSession: mocks.refreshSession }));
beforeEach(() => { vi.resetAllMocks(); mocks.isMemoryDataMode.mockReturnValue(false); });

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
  it("keeps the memory-mode bypass", async () => {
    mocks.isMemoryDataMode.mockReturnValue(true);
    expect((await proxy(new NextRequest("http://localhost:3000/feed"))).status).toBe(200);
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });
});
