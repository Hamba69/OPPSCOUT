import { describe, expect, it } from "vitest";

import { canonicalPreferredLocation, canonicalUgandaLocation, UGANDA_LOCATIONS } from "@/data/uganda-locations";
import { dateOfBirthProblem } from "@/lib/date-of-birth";
import { newProfileSchema, profileSchema } from "@/lib/validation";
import { buildProfileChoices } from "@/services/profile/choices";

const today = new Date("2026-11-23T00:00:00Z");

describe("Uganda-only locations", () => {
  it("maps what people type to the district name", () => {
    expect(canonicalUgandaLocation("kampala")).toBe("Kampala");
    expect(canonicalUgandaLocation("Gulu District, Uganda")).toBe("Gulu");
    expect(canonicalUgandaLocation("Luwero")).toBe("Luweero");
    expect(canonicalUgandaLocation("Fort Portal City")).toBe("Fort Portal");
  });

  it("rejects places outside Uganda and vague answers", () => {
    for (const value of ["Nairobi, Kenya", "Remote", "Africa", "To Confirm", "Uganda", ""]) expect(canonicalUgandaLocation(value)).toBeNull();
    expect(canonicalPreferredLocation("Uganda")).toBe("Uganda");
    expect(canonicalPreferredLocation("Kigali, Rwanda")).toBeNull();
  });

  it("offers only Ugandan districts in the profile form, ignoring listing locations", () => {
    const choices = buildProfileChoices([{ location: "Not Captured", eligibility: {}, requiredSkills: [], preferredSkills: [], category: "job" } as never]);
    expect(choices.location.map((item) => item.value)).toEqual([...UGANDA_LOCATIONS]);
    expect(choices.location.some((item) => item.value === "Not Captured")).toBe(false);
    expect(choices.preferredLocations[0]).toMatchObject({ value: "Uganda", label: "Anywhere in Uganda" });
  });

  it("stores the canonical name and refuses anything else", () => {
    expect(profileSchema.parse({ location: "mbarara district", preferredLocations: ["kampala", "Kampala", "uganda"] })).toMatchObject({ location: "Mbarara", preferredLocations: ["Kampala", "Uganda"] });
    expect(profileSchema.safeParse({ location: "London" }).success).toBe(false);
    expect(profileSchema.safeParse({ preferredLocations: ["Remote"] }).success).toBe(false);
  });
});

describe("date of birth is required", () => {
  it("explains what is wrong", () => {
    expect(dateOfBirthProblem("", today)).toMatch(/Enter your date of birth/);
    expect(dateOfBirthProblem("2030-01-01", today)).toMatch(/future/);
    expect(dateOfBirthProblem("2015-01-01", today)).toMatch(/at least 18/);
    expect(dateOfBirthProblem("1900-01-01", today)).toMatch(/Check the year/);
    expect(dateOfBirthProblem("2001-05-14", today)).toBeNull();
  });

  it("a new profile needs a date of birth and a district", () => {
    expect(newProfileSchema.safeParse({ name: "Grace", location: "Kampala" }).success).toBe(false);
    expect(newProfileSchema.safeParse({ name: "Grace", dateOfBirth: "2001-05-14" }).success).toBe(false);
    expect(newProfileSchema.parse({ name: "Grace", dateOfBirth: "2001-05-14", location: "kampala" })).toMatchObject({ location: "Kampala", dateOfBirth: new Date("2001-05-14T00:00:00Z") });
  });

  it("an update can change the date of birth but not clear it", () => {
    expect(profileSchema.safeParse({ dateOfBirth: null }).success).toBe(false);
    expect(profileSchema.safeParse({ notificationsEnabled: true }).success).toBe(true);
  });
});
