// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OpportunitiesBrowser } from "@/components/opportunities-browser";

afterEach(cleanup);

describe("opportunity category filters", () => {
  it("shows supplied categories in one row that scrolls sideways", () => {
    render(createElement(OpportunitiesBrowser, {
      items: [],
      categories: ["job", "internship"],
      now: new Date(),
    }));

    const categoryGroup = screen.getByRole("group", { name: "Filter by category" });
    expect(categoryGroup.className).toContain("chip-row");
    expect(screen.getByRole("button", { name: "Jobs" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Internships" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Grants" })).toBeNull();
  });

  it("marks the active category as pressed", () => {
    render(createElement(OpportunitiesBrowser, {
      items: [],
      categories: ["job", "internship"],
      now: new Date(),
      initialType: "job",
    }));

    expect(screen.getByRole("button", { name: "Jobs" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Internships" }).getAttribute("aria-pressed")).toBe("false");
  });
});
