import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAdmin } from "../../scripts/create-admin";

const mocks = vi.hoisted(() => ({ listUsers: vi.fn(), updateUserById: vi.fn(), createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://unit-test.example.com");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "unit-test-only-not-a-credential");
  mocks.createClient.mockReturnValue({ auth: { admin: mocks } });
  mocks.updateUserById.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());

describe("admin provisioning", () => {
  it("rejects missing or placeholder credentials before contacting Auth", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    await expect(createAdmin(["person@example.com"])).rejects.toThrow("Set real");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key");
    await expect(createAdmin(["person@example.com"])).rejects.toThrow("Set real");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it("requires exactly one valid email", async () => {
    await expect(createAdmin([])).rejects.toThrow("Usage:");
    await expect(createAdmin(["invalid"])).rejects.toThrow("Usage:");
    await expect(createAdmin(["a@example.com", "b@example.com"])).rejects.toThrow("Usage:");
  });
  it("finds later pages and preserves other app metadata", async () => {
    mocks.listUsers.mockResolvedValueOnce({ data: { users: Array.from({ length: 1000 }, () => ({ email: "other@example.com" })) }, error: null });
    mocks.listUsers.mockResolvedValueOnce({ data: { users: [{ id: "target", email: "Person@example.com", app_metadata: { organizationId: "org" } }] }, error: null });
    await expect(createAdmin(["person@example.com"])).resolves.toContain("Admin role granted");
    expect(mocks.listUsers).toHaveBeenLastCalledWith({ page: 2, perPage: 1000 });
    expect(mocks.updateUserById).toHaveBeenCalledWith("target", { app_metadata: { organizationId: "org", role: "admin" } });
  });
  it("explains that an unknown person must sign up first", async () => {
    mocks.listUsers.mockResolvedValue({ data: { users: [] }, error: null });
    await expect(createAdmin(["person@example.com"])).rejects.toThrow("sign up first");
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });
  it("fails on lookup and update errors", async () => {
    mocks.listUsers.mockResolvedValueOnce({ error: { status: 403 } });
    await expect(createAdmin(["person@example.com"])).rejects.toThrow("Unable to look up");
    mocks.listUsers.mockResolvedValue({ data: { users: [{ id: "target", email: "person@example.com", app_metadata: {} }] }, error: null });
    mocks.updateUserById.mockResolvedValue({ error: { status: 403 } });
    await expect(createAdmin(["person@example.com"])).rejects.toThrow("Unable to grant");
  });
});
