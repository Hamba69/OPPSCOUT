// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

    expect(screen.getByRole("link", { name: /Jobs/ }).getAttribute("href")).toBe("/feed?type=job");
    expect(screen.getByRole("link", { name: /Internships/ }).getAttribute("href")).toBe("/feed?type=internship");
    expect(screen.getByRole("link", { name: /Consultancies/ }).getAttribute("href")).toBe("/feed?type=consultancy");
    expect(screen.queryByRole("link", { name: /Grants/ })).toBeNull();
  });

  it("shows only the selected category's matches", () => {
    render(createElement(FeedBrowser, { items, salutation: "Good morning", initialType: "job" }));

    expect(screen.getByRole("heading", { name: "Jobs matches" })).toBeTruthy();
    expect(screen.getByText("Research Officer")).toBeTruthy();
    expect(screen.queryByText("Data Internship")).toBeNull();
    expect(screen.queryByText("Policy Consultant")).toBeNull();
    expect(screen.getByRole("link", { name: "All matches" }).getAttribute("href")).toBe("/feed");
  });
});
