/** Why someone was sent here, in their words, from where they were heading. */
export function loginReason(nextPath: string, explicit: boolean): string | null {
  if (nextPath.startsWith("/opportunities") || nextPath.startsWith("/opportunity")) return "Create a free account to browse opportunities and see how well each one fits you.";
  if (nextPath.startsWith("/dashboard")) return "Create a free account to post an opportunity. Our team reviews every post before it goes live.";
  if (nextPath.startsWith("/profile")) return "Create a free account, tell us about yourself, and we'll match you with jobs, scholarships and more.";
  if (explicit && nextPath !== "/feed") return "Log in, or create a free account, to continue.";
  return null;
}
