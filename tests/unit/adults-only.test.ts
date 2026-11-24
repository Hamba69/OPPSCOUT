import { describe, expect, it } from "vitest";

import { accountBirthDate, isConfirmedAdult } from "@/lib/adult";
import { dateOfBirthProblem, MIN_SEEKER_AGE } from "@/lib/date-of-birth";

const today = new Date("2026-11-24T12:00:00Z");

describe("OppScout is for adults only", () => {
  it("requires 18 or older", () => {
    expect(MIN_SEEKER_AGE).toBe(18);
    expect(dateOfBirthProblem("2008-11-24", today)).toBeNull();
    expect(dateOfBirthProblem("2008-11-25", today)).toMatch(/at least 18/);
  });

  it("accepts an account only once it holds an 18+ date of birth", () => {
    expect(isConfirmedAdult({ user_metadata: { dateOfBirth: "2000-01-01" } }, today)).toBe(true);
    expect(isConfirmedAdult({ user_metadata: { dateOfBirth: "2010-01-01" } }, today)).toBe(false);
    expect(isConfirmedAdult({ user_metadata: {} }, today)).toBe(false);
    expect(isConfirmedAdult({ user_metadata: { dateOfBirth: "not a date" } }, today)).toBe(false);
    expect(isConfirmedAdult(null, today)).toBe(false);
  });

  it("does not ask reviewers, and is not fooled by a role in editable metadata", () => {
    expect(isConfirmedAdult({ app_metadata: { role: "admin" } }, today)).toBe(true);
    expect(isConfirmedAdult({ user_metadata: { role: "admin" } }, today)).toBe(false);
  });

  it("reads the account date as YYYY-MM-DD", () => {
    expect(accountBirthDate({ user_metadata: { dateOfBirth: "2001-05-14T00:00:00.000Z" } })).toBe("2001-05-14");
    expect(accountBirthDate({ user_metadata: { dateOfBirth: 20010514 } })).toBeNull();
  });
});
