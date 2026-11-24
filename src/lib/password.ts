/** Shortest password allowed at sign-up and when resetting. */
export const MIN_PASSWORD_LENGTH = 8;
/** The rule as shown under password fields. */
export const PASSWORD_HINT = `Use ${MIN_PASSWORD_LENGTH}+ characters with uppercase, lowercase, a number and a symbol.`;

export function validateSignupPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.trim() !== password) return "Password cannot start or end with spaces.";
  if (/\s/.test(password)) return "Password cannot contain spaces.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return "Use both uppercase and lowercase letters.";
  if (!/\d/.test(password)) return "Include at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Include at least one symbol.";
  return null;
}
