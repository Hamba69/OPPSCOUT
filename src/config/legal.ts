/**
 * Facts the Privacy Policy and Terms depend on. Fill these in on Vercel before launch:
 * - NEXT_PUBLIC_LEGAL_ENTITY: the registered name of whoever runs OppScout (company, NGO or person).
 * - NEXT_PUBLIC_PRIVACY_EMAIL: where people send data requests and questions.
 * - NEXT_PUBLIC_POSTAL_ADDRESS: a physical or postal address in Uganda.
 * - NEXT_PUBLIC_PDPO_REGISTRATION: your Personal Data Protection Office registration number, once issued.
 * Without them the pages still render, pointing people to the Feedback page instead of an email.
 */
export const LEGAL = {
  entity: process.env.NEXT_PUBLIC_LEGAL_ENTITY?.trim() || "OppScout",
  privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL?.trim() || null,
  postalAddress: process.env.NEXT_PUBLIC_POSTAL_ADDRESS?.trim() || null,
  pdpoRegistration: process.env.NEXT_PUBLIC_PDPO_REGISTRATION?.trim() || null,
  /** Change these when the text changes; sign-up records which version a person agreed to. */
  termsVersion: "2026-11-23",
  updated: "23 November 2026",
} as const;
