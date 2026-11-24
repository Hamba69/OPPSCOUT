import { describe, expect, it } from "vitest";

import { closingText, eligibilityLines } from "@/components/opportunity-facts";

const now = new Date("2026-11-23T09:00:00Z");

describe("opportunity key facts", () => {
  it("shows days left only for saved opportunities", () => {
    // Not saved: just the date, no countdown or urgent colour.
    expect(closingText({ deadline: new Date("2026-12-03T21:00:00Z"), deadlineType: "fixed" }, now)).toEqual({ label: "Closes 4 Dec 2026", urgent: false });
    expect(closingText({ deadline: new Date("2026-11-26T20:00:00Z"), deadlineType: "fixed" }, now).urgent).toBe(false);
    // Saved: the countdown appears.
    expect(closingText({ deadline: new Date("2026-12-03T21:00:00Z"), deadlineType: "fixed" }, now, { countdown: true })).toEqual({ label: "Closes 4 Dec 2026 · 11 days left", urgent: false });
    expect(closingText({ deadline: new Date("2026-11-26T20:00:00Z"), deadlineType: "fixed" }, now, { countdown: true }).urgent).toBe(true);
    expect(closingText({ deadline: null, deadlineType: "rolling" }, now).label).toBe("Open until filled");
  });

  it("explains who can apply in plain words", () => {
    expect(eligibilityLines({ educationLevels: ["bachelors", "masters"], fieldsOfStudy: ["information technology"], minimumAge: 20, minimumExperienceMonths: 24 })).toEqual([
      "Education: Bachelor’s degree, Master’s degree",
      "Field of study: Information Technology",
      "Age: 20 or older",
      "Experience: at least 2 years",
    ]);
    expect(eligibilityLines({ minimumAge: 18, maximumAge: 30, programmeRules: [{ field: "location", allowedValues: ["Uganda"], label: "Residency" }] })).toEqual(["Age: 18 to 30", "Where you live: Uganda"]);
    expect(eligibilityLines({})).toEqual([]);
  });
});
