// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryMatches } from "@/components/category-matches";
import type { FeedItem } from "@/components/feed-browser";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode; [key: string]: unknown }) =>
    createElement("a", { ...props, href }, children),
}));
vi.mock("@/components/match-card", () => ({
  MatchCard: ({ title }: { title: string }) => createElement("article", null, title),
}));

afterEach(cleanup);

const items: FeedItem[] = [
  { id: "job-match", opportunityId: "job", category: "job", categoryLabel: "Jobs", title: "Research Officer", organization: "Example", origin: "catalog", score: 90, deadline: null, location: "Kampala", workMode: "", sourceUrl: "https://example.org/job", checkedAt: "2026-01-01", publicationDate: "2026-01-01", daysLeft: null },
  { id: "internship-match", opportunityId: "internship", category: "internship", categoryLabel: "Internships", title: "Data Internship", organization: "Example", origin: "catalog", score: 85, deadline: null, location: "Kampala", workMode: "", sourceUrl: "https://example.org/internship", checkedAt: "2026-01-01", publicationDate: "2026-01-01", daysLeft: null },
  { id: "consultancy-match", opportunityId: "consultancy", category: "consultancy", categoryLabel: "Consultancies", title: "Policy Consultant", organization: "Example", origin: "catalog", score: 80, deadline: null, location: "Remote", workMode: "", sourceUrl: "https://example.org/consultancy", checkedAt: "2026-01-01", publicationDate: "2026-01-01", daysLeft: null },
];

describe("today\u2019s matches", () => {
  it("opens on the type in the address and filters in place", () => {
    render(createElement(CategoryMatches, { items, category: "job" }));

    expect(screen.getByRole("heading", { name: "Today\u2019s matches" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jobs" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Research Officer")).toBeTruthy();
    expect(screen.queryByText("Data Internship")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Internships" }));
    expect(screen.getByRole("heading", { name: "Today\u2019s matches" })).toBeTruthy();
    expect(screen.getByText("Data Internship")).toBeTruthy();
    expect(screen.queryByText("Research Officer")).toBeNull();
    expect(window.location.pathname).toBe("/feed/internship");
  });

  it("shows every match under All", () => {
    render(createElement(CategoryMatches, { items, category: "all" }));

    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Research Officer")).toBeTruthy();
    expect(screen.getByText("Data Internship")).toBeTruthy();
    expect(screen.getByText("Policy Consultant")).toBeTruthy();
  });

  it("keeps the type filters in one row that scrolls sideways, as buttons rather than page links", () => {
    render(createElement(CategoryMatches, { items, category: "all" }));

    expect(screen.getByRole("group", { name: "Filter matches by type" }).className).toContain("chip-row");
    expect(screen.queryByRole("link", { name: "Consultancies" })).toBeNull();
    expect(screen.getByRole("button", { name: "Consultancies" })).toBeTruthy();
  });
});
