export function validateSignupPassword(password: string): string | null {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password.trim() !== password) return "Password cannot start or end with spaces.";
  if (/\s/.test(password)) return "Password cannot contain spaces.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return "Use both uppercase and lowercase letters.";
  if (!/\d/.test(password)) return "Include at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Include at least one symbol.";
  return null;
}
