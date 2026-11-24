// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ pathname: "/dashboard/opportunities" }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode; [key: string]: unknown }) =>
    createElement("a", { ...props, href }, children),
}));

import { SiteHeader } from "@/components/site-header";

afterEach(cleanup);

describe("site header", () => {
  it("leaves the publisher area to its own menu, like the seeker app", () => {
    mocks.pathname = "/dashboard/new";
    const { container } = render(createElement(SiteHeader));
    expect(container.innerHTML).toBe("");
  });

  it("keeps the admin home link without rendering an account icon or menu", () => {
    mocks.pathname = "/admin/review";
    render(createElement(SiteHeader));

    expect(screen.getByRole("link", { name: "OppScout home" }).getAttribute("href")).toBe("/admin/overview");
    expect(screen.queryByRole("button", { name: "Account" })).toBeNull();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("keeps the landing-page login and get-started actions", () => {
    mocks.pathname = "/";
    render(createElement(SiteHeader));

    expect(screen.getByRole("link", { name: "Log in" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Get started" }).getAttribute("href")).toBe("/login?mode=signup&next=%2Fprofile");
  });
});
