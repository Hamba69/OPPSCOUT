// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryMatches } from "@/components/category-matches";
import { FeedBrowser, type FeedItem } from "@/components/feed-browser";

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

describe("seeker feed categories", () => {
  it("links to category-filtered matches and includes categories found in the user's matches", () => {
    render(createElement(FeedBrowser, { items, salutation: "Good morning" }));

    expect(screen.getByRole("link", { name: /Jobs/ }).getAttribute("href")).toBe("/feed/job");
    expect(screen.getByRole("link", { name: /Internships/ }).getAttribute("href")).toBe("/feed/internship");
    expect(screen.getByRole("link", { name: /Consultancies/ }).getAttribute("href")).toBe("/feed/consultancy");
    expect(screen.queryByRole("link", { name: /Grants/ })).toBeNull();
  });

  it("shows only the selected category's matches on its own page", () => {
    render(createElement(CategoryMatches, { items, category: "job" }));

    expect(screen.getByRole("heading", { name: "Jobs matches" })).toBeTruthy();
    expect(screen.getByText("Research Officer")).toBeTruthy();
    expect(screen.queryByText("Data Internship")).toBeNull();
    expect(screen.queryByText("Policy Consultant")).toBeNull();
    expect(screen.getByRole("link", { name: "All" }).getAttribute("href")).toBe("/feed/all");
    expect(screen.getByRole("link", { name: "Jobs" }).getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("button", { name: /clear|show all/i })).toBeNull();
  });

  it("shows every match under All", () => {
    render(createElement(CategoryMatches, { items, category: "all" }));

    expect(screen.getByRole("heading", { name: "All matches" })).toBeTruthy();
    expect(screen.getByText("Research Officer")).toBeTruthy();
    expect(screen.getByText("Data Internship")).toBeTruthy();
    expect(screen.getByText("Policy Consultant")).toBeTruthy();
  });

  it("hides recommendations on phones until the seeker searches", () => {
    render(createElement(FeedBrowser, { items, salutation: "Good morning" }));

    expect(screen.getByRole("region", { name: "Matches" }).className).toContain("hidden sm:flex");
  });

  it("shows search results directly under the search bar, above the category cards", () => {
    render(createElement(FeedBrowser, { items, salutation: "Good morning" }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "data" } });

    const results = screen.getByRole("region", { name: "Matches" });
    const tiles = screen.getByRole("navigation", { name: "Browse by type" });
    expect(results.compareDocumentPosition(tiles) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(results.className).not.toContain("hidden");
    expect(screen.getByText("Data Internship")).toBeTruthy();
    expect(screen.queryByText("Research Officer")).toBeNull();
  });
});
