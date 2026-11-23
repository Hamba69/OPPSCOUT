import { NotFoundError } from "@/core/errors/app-error";
import type { Opportunity, SubmitterContact } from "@/core/entities/domain";
import type { Repository } from "@/lib/repository/types";

export const CONTACT_METHODS = ["call", "whatsapp", "email", "other"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

const RELATIONSHIP_LABEL: Record<SubmitterContact["relationship"], string> = {
  work_there: "Works at the organisation",
  recruiting_for_them: "Recruiting on their behalf",
  sharing_public_listing: "Sharing a public listing they found",
};
export const relationshipLabel = (value: SubmitterContact["relationship"]): string => RELATIONSHIP_LABEL[value] ?? value;

/** Digits for a wa.me link. Ugandan numbers written locally (0772…) get the 256 country code. */
export function whatsappNumber(phone: string): string | null {
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return null;
  if (phone.trim().startsWith("+")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `256${digits.slice(1)}`;
  if (digits.length === 9) return `256${digits}`;
  return digits;
}

/** One-tap ways to reach the poster, with a short message about this listing already written. */
export function contactLinks(contact: SubmitterContact, title: string): { email: string; call: string; whatsapp: string | null } {
  const greeting = `Hello ${contact.name.split(" ")[0]}, this is the OppScout review team about the opportunity you posted, "${title}".`;
  const whatsapp = whatsappNumber(contact.phone);
  return {
    email: `mailto:${contact.email}?subject=${encodeURIComponent(`About your OppScout post: ${title}`)}&body=${encodeURIComponent(`${greeting}\n\nBefore we publish it, could you confirm `)}`,
    call: `tel:${contact.phone.replace(/[^0-9+]/g, "")}`,
    whatsapp: whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(greeting)}` : null,
  };
}

/** Lines in the review notes that record contact with the poster, newest last. */
export function contactLogLines(notes: string | null | undefined): string[] {
  return (notes ?? "").split("\n").map((line) => line.trim()).filter((line) => /^Contacted poster /.test(line));
}

const METHOD_LABEL: Record<ContactMethod, string> = { call: "by phone", whatsapp: "on WhatsApp", email: "by email", other: "" };

/** Records that a reviewer contacted the poster, and what was agreed, in the listing's review notes. */
export async function logPosterContact(repository: Repository, id: string, method: ContactMethod, note: string, now = new Date()): Promise<Opportunity> {
  const opportunity = await repository.getOpportunity(id);
  if (!opportunity) throw new NotFoundError("Opportunity");
  const how = METHOD_LABEL[method] ? ` ${METHOD_LABEL[method]}` : "";
  const line = `Contacted poster ${now.toISOString().slice(0, 10)}${how}: ${note.trim().replace(/\s+/g, " ")}`;
  return repository.setReviewNotes(id, [opportunity.reviewNotes?.trim(), line].filter(Boolean).join("\n"));
}
