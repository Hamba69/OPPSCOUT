import { dateOfBirthProblem } from "@/lib/date-of-birth";

/** Where people without a confirmed adult date of birth are sent before using OppScout. */
export const CONFIRM_AGE_PATH = "/confirm-age";

interface AccountUser { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }

/** The date of birth recorded on the sign-in account (given at sign-up or confirmed since), as YYYY-MM-DD. */
export function accountBirthDate(user: AccountUser | null | undefined): string | null {
  const value = user?.user_metadata?.dateOfBirth;
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
}

/**
 * OppScout is for adults only. A person may use it once their account holds a date of birth showing they are
 * 18 or older. Reviewers (admins) are staff accounts and are not asked. Used by the proxy for every app page
 * and by requireAuth for the API, so neither the pages nor the API can be reached without it.
 */
export function isConfirmedAdult(user: AccountUser | null | undefined, today = new Date()): boolean {
  if (user?.app_metadata?.role === "admin") return true;
  const birth = accountBirthDate(user);
  return Boolean(birth) && dateOfBirthProblem(birth, today) === null;
}
