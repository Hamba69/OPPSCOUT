import { describe, expect, it } from "vitest";

import { displayDescription } from "@/lib/opportunity-description";

describe("displayDescription", () => {
  it("never suggests a listing with a closing date has none", () => {
    expect(displayDescription("Applicants must be at least 20 years old. Applications close on 4 December 2026; no closing time is stated, so deliver yours a day early to be safe."))
      .toBe("Applicants must be at least 20 years old. Applications close on 4 December 2026. To be safe, deliver yours a day early.");
    expect(displayDescription("Applications close on 1 December 2026; no closing time is stated, so apply at least a day before the deadline to be safe."))
      .toBe("Applications close on 1 December 2026. To be safe, apply at least a day before the deadline.");
    expect(displayDescription("Apply online by 30 November. The page gives no closing time, so 00:00 on 30 November 2026 Washington time is used. Letters are due 4 December."))
      .toBe("Apply online by 30 November. Letters are due 4 December.");
  });

  it("leaves other wording alone", () => {
    const text = "Applications close on 1 February 2027, but are reviewed on a rolling basis.";
    expect(displayDescription(text)).toBe(text);
  });
});
