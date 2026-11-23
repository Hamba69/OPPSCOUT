/** Field names in API validation errors, in words a publisher would use. */
const FIELD_LABELS: Record<string, string> = {
  title: "Title", description: "Description", applicationMethod: "Application instructions", sourceUrl: "Official link",
  deadline: "Closing date", location: "Location", category: "Opportunity type", workMode: "Work arrangement",
  name: "Organization name", sector: "Sector", officialEmail: "Official email", officialLinks: "Official website",
  registrationProof: "URSB registration number", accountableContacts: "Accountable contacts",
};

/**
 * The most useful sentence from an API error body: the first field problem ("Official link: Use a public
 * HTTPS URL…"), else the error message, else the fallback. Generic "Request validation failed." is skipped.
 */
export async function apiErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null) as { error?: { message?: string; details?: { fieldErrors?: Record<string, string[] | undefined>; formErrors?: string[] } | null } } | null;
  const fieldErrors = body?.error?.details?.fieldErrors ?? {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) return `${FIELD_LABELS[field] ?? field}: ${messages[0]}`;
  }
  const formError = body?.error?.details?.formErrors?.[0];
  if (formError) return formError;
  const message = body?.error?.message;
  return message && message !== "Request validation failed." ? message : fallback;
}
