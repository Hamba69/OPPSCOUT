// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ pathname: "/feed" }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("next/link", () => ({
  default: ({ href, children, prefetch, ...props }: { href: string; children: ReactNode; prefetch?: boolean; [key: string]: unknown }) => {
    void prefetch;
    return createElement("a", { ...props, href }, children);
  },
}));

import { SeekerFrame } from "@/components/app-shell";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("mobile seeker navigation", () => {
  it("opens the sidebar with all account actions and closes it with Escape", () => {
    render(createElement(SeekerFrame, null, createElement("main", null, "Matches page")));

    const menuButton = screen.getByRole("button", { name: "Menu" });
    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(menuButton);

    expect(screen.getByRole("dialog", { name: "Main navigation" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "My profile" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Feedback" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    expect(document.body.style.overflow).toBe("");
  });
});
