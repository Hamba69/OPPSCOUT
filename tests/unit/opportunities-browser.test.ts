// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OpportunitiesBrowser } from "@/components/opportunities-browser";

afterEach(cleanup);

describe("opportunity category filters", () => {
  it("shows supplied categories in a single horizontally scrollable capsule row", () => {
    render(createElement(OpportunitiesBrowser, {
      items: [],
      categories: ["job", "internship"],
      now: new Date(),
    }));

    const categoryGroup = screen.getByRole("group", { name: "Filter by category" });
    expect(categoryGroup.className).toContain("overflow-x-auto");
    expect(categoryGroup.className).toContain("category-nav");
    expect(screen.getByRole("button", { name: "Jobs" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Internships" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Grants" })).toBeNull();
  });
});
