// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth-form";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(), updateUser: vi.fn(), getUser: vi.fn(),
  push: vi.fn(), replace: vi.fn(), refresh: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: mocks }) }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user" } }, error: null });
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("password recovery", () => {
  it("requests recovery using only a valid email, without a password", async () => {
    render(createElement(AuthForm, { nextPath: "/feed" }));
    fireEvent.click(screen.getByText("Forgot your password?"));
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "person@example.com" } });
    fireEvent.click(screen.getByText("Forgot your password?"));
    await screen.findByText("Check your email for a link to reset your password.");
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith("person@example.com", {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.queryByText("Forgot your password?")).toBeNull();
  });

  it("recovers from a request failure and allows retry", async () => {
    mocks.resetPasswordForEmail.mockRejectedValueOnce(new Error("network"));
    render(createElement(AuthForm, { nextPath: "/feed" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "person@example.com" } });
    fireEvent.click(screen.getByText("Forgot your password?"));
    await screen.findByText("Unable to send a reset email. Please try again.");
    fireEvent.click(screen.getByText("Forgot your password?"));
    await screen.findByText("Check your email for a link to reset your password.");
  });

  it("blocks password updates without a valid session and offers recovery", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    render(createElement(ResetPasswordPage));
    await screen.findByText(/Your reset session has expired/);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/login");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("shows success before redirecting to the feed", async () => {
    render(createElement(ResetPasswordPage));
    await waitFor(() => expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false));
    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "test-password-only" } });
    await fireEvent.submit(screen.getByRole("button").closest("form")!);
    // Flush React updates before advancing the redirect timer.
    const { act } = await import("@testing-library/react");
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole("status").textContent).toContain("Password updated");
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "test-password-only" });
    expect(mocks.replace).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1500); });
    expect(mocks.replace).toHaveBeenCalledWith("/feed");
  });

  it("handles a session expiring during the password update", async () => {
    mocks.updateUser.mockResolvedValue({ error: { status: 401, message: "expired" } });
    render(createElement(ResetPasswordPage));
    await waitFor(() => expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "test-password-only" } });
    fireEvent.submit(screen.getByRole("button").closest("form")!);
    await screen.findByText(/Your reset session has expired/);
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
