// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ClosingSoon, NewToday, ProfileStrength, TodayCard } from "@/components/home-briefing";
import { MATCHING_STEPS, MatchingProgress } from "@/components/matching-progress";
import { profileNudge } from "@/services/profile/nudge";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode; [key: string]: unknown }) =>
    createElement("a", { ...props, href }, children),
}));
vi.mock("@/components/save-button", () => ({
  SaveButton: ({ opportunityId }: { opportunityId: string }) => createElement("button", { type: "button", "aria-label": `Save ${opportunityId}` }),
}));

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Matches home briefing", () => {
  it("shows the date, the greeting and one button to today's matches", () => {
    render(createElement(TodayCard, { dateLine: "Sunday 22 November", salutation: "Good afternoon", firstName: "Grace", ready: true }));

    expect(screen.getByText("Sunday 22 November")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Good afternoon, Grace" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /View today.s matches/ }).getAttribute("href")).toBe("/feed/all");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("asks for the profile first when matching cannot run yet", () => {
    render(createElement(TodayCard, { dateLine: "Sunday 22 November", salutation: "Good morning", ready: false }));

    expect(screen.getByRole("link", { name: /Complete your profile/ }).getAttribute("href")).toBe("/profile");
    expect(screen.queryByRole("link", { name: /View today.s matches/ })).toBeNull();
  });

  it("lists saved items closing soon without save buttons", () => {
    render(createElement(ClosingSoon, { fromSaved: true, items: [{ opportunityId: "a", title: "Data Trainee", detail: "Example · closes 26 Nov", daysLeft: 4 }] }));

    expect(screen.getByRole("heading", { name: "Closing soon" })).toBeTruthy();
    expect(screen.getByText("From your saved list")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Data Trainee" }).getAttribute("href")).toBe("/opportunity/a");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("falls back to the seeker's matches, each with a save button", () => {
    render(createElement(ClosingSoon, { fromSaved: false, items: [{ opportunityId: "b", title: "AU Internship", detail: "81% match · closes 30 Dec", daysLeft: 9 }] }));

    expect(screen.getByRole("heading", { name: "Closing soon in your matches" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save b" })).toBeTruthy();
    expect(screen.queryByText(/Save one/)).toBeNull();
  });

  it("leaves out empty sections", () => {
    const { container } = render(createElement("div", null,
      createElement(ClosingSoon, { fromSaved: true, items: [] }),
      createElement(NewToday, { tiles: [] }),
      createElement(ProfileStrength, { nudge: null })));

    expect(container.textContent).toBe("");
  });

  it("links each new-today tile to the Opportunities page filtered by type", () => {
    render(createElement(NewToday, { tiles: [{ type: "job", label: "Jobs", count: 5 }, { type: "internship", label: "Internships", count: 2 }] }));

    expect(screen.getByRole("link", { name: /5\s*Jobs/ }).getAttribute("href")).toBe("/opportunities?type=job");
    expect(screen.getByRole("link", { name: "Browse all" }).getAttribute("href")).toBe("/opportunities");
  });
});

describe("profile nudge", () => {
  const complete = {
    name: "Grace N", email: "g@example.com", phone: "+256700000000", dateOfBirth: new Date("2000-01-01"), location: "Kampala",
    educationLevel: "bachelors", institution: "Makerere University", fieldOfStudy: "communications", graduationStatus: "graduated",
    skills: ["communication"], certifications: ["CPA"], languages: ["English"],
    workExperience: [{ title: "Assistant", months: 12 }], internshipExperience: [{ title: "Intern", months: 3 }],
    opportunityCategories: ["job"], careerInterests: ["media"], preferredLocations: ["Kampala"], workModePreference: "onsite",
    githubUrl: "https://github.com/g", portfolioUrl: "https://g.example.com", otherLinks: [{ label: "Blog", url: "https://b.example.com" }],
    projects: [{ title: "Survey", description: "", tags: [] }],
  };

  it("is null for a complete profile, so the card is left out", () => {
    expect(profileNudge(complete as never)).toBeNull();
  });

  it("ignores optional fields: missing links, projects, phone or experience leave the card out", () => {
    const essentialsOnly = { ...complete, phone: "", certifications: [], workExperience: [], internshipExperience: [], githubUrl: "", portfolioUrl: "", otherLinks: [], projects: [] };
    expect(profileNudge(essentialsOnly as never)).toBeNull();
  });

  it("suggests the missing field matching relies on most, and links to its section", () => {
    const nudge = profileNudge({ ...complete, languages: [], githubUrl: "" } as never);
    expect(nudge?.field).toBe("Languages");
    expect(nudge?.href).toBe("/profile#skills");
    expect(nudge?.completeness).toBeLessThan(100);
  });
});

describe("matching progress", () => {
  it("steps through the matching stages and holds on the last one", () => {
    vi.useFakeTimers();
    render(createElement(MatchingProgress));
    expect(screen.getByRole("status").textContent).toBe(MATCHING_STEPS[0]);

    act(() => { vi.advanceTimersByTime(750 * 10); });
    expect(screen.getByRole("status").textContent).toBe(MATCHING_STEPS[MATCHING_STEPS.length - 1]);
  });
});
