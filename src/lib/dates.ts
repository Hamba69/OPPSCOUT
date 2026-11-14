/**
 * OppScout shows every date in Uganda time. Servers (Vercel) run in UTC while browsers run in the
 * person's own time zone, so formatting without a fixed time zone printed deadlines a day apart on the
 * server and in the browser. That mismatch broke hydration (React error #418) and showed the wrong day.
 * Safe to import from both server and client components.
 */
export const APP_TIME_ZONE = "Africa/Kampala";
const LOCALE = "en-UG";

type DateInput = Date | string | number;

/** A calendar date in Uganda time, e.g. formatDate(d, { day: "numeric", month: "short" }) -> "19 Nov". */
export function formatDate(value: DateInput, options: Intl.DateTimeFormatOptions = {}): string {
  return new Date(value).toLocaleDateString(LOCALE, { timeZone: APP_TIME_ZONE, ...options });
}

/** A date and time in Uganda time. */
export function formatDateTime(value: DateInput, options: Intl.DateTimeFormatOptions = {}): string {
  return new Date(value).toLocaleString(LOCALE, { timeZone: APP_TIME_ZONE, ...options });
}
