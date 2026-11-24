/** OppScout is for adults only: people must be at least this old to use it. */
export const MIN_SEEKER_AGE = 18;
export const MAX_SEEKER_AGE = 100;

function ageOn(birth: Date, today: Date): number {
  const beforeBirthday = today.getUTCMonth() < birth.getUTCMonth()
    || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate());
  return today.getUTCFullYear() - birth.getUTCFullYear() - (beforeBirthday ? 1 : 0);
}

/**
 * Why a date of birth cannot be saved, or null when it is fine. Shared by the profile form and the API,
 * so both give the same message. Date of birth is required because listings can set age limits.
 */
export function dateOfBirthProblem(value: Date | string | null | undefined, today = new Date()): string | null {
  if (value === null || value === undefined || value === "") return "Enter your date of birth. Some opportunities have age limits.";
  const birth = typeof value === "string" ? new Date(`${value.slice(0, 10)}T00:00:00Z`) : value;
  if (Number.isNaN(birth.getTime())) return "Enter a valid date of birth.";
  if (birth > today) return "Date of birth cannot be in the future.";
  const age = ageOn(birth, today);
  if (age < MIN_SEEKER_AGE) return `You must be at least ${MIN_SEEKER_AGE} years old to use OppScout.`;
  if (age > MAX_SEEKER_AGE) return "Check the year of your date of birth.";
  return null;
}
