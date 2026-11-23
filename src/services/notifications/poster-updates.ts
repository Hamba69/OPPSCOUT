import type { Opportunity } from "@/core/entities/domain";
import { appUrl } from "@/config/app";
import type { Repository } from "@/lib/repository/types";
import { sendEmail } from "@/services/notifications/email/send-email";

/** What happened to a member's post. */
export type PosterEvent = "approved" | "rejected" | "withdrawn" | "readmitted";

function siteUrl(): string {
  try { return appUrl(); } catch { return "https://oppscout-delta.vercel.app"; }
}

/** The email for each decision. `note` is the reviewer's own note, shown as written. */
export function posterUpdateMessage(event: PosterEvent, opportunity: Pick<Opportunity, "id" | "title">, firstName: string, note?: string | null): { subject: string; text: string } {
  const postings = `${siteUrl()}/dashboard`;
  const edit = `${siteUrl()}/dashboard/${opportunity.id}/edit`;
  const reason = note?.trim() ? `\n\nNote from our review team: ${note.trim()}` : "";
  const hello = `Hello ${firstName},`;
  switch (event) {
    case "approved":
    case "readmitted":
      return {
        subject: `Your opportunity is live on OppScout: ${opportunity.title}`,
        text: `${hello}\n\nGood news: "${opportunity.title}" has been reviewed and is now live. OppScout will show it to people it suits until it closes.${reason}\n\nSee your postings: ${postings}\n\nThank you for sharing it.\nThe OppScout team`,
      };
    case "rejected":
      return {
        subject: `Changes needed before we can publish: ${opportunity.title}`,
        text: `${hello}\n\nWe reviewed "${opportunity.title}" and could not publish it as it is.${reason}\n\nYou can update it and save it to send it back for review: ${edit}\n\nThe OppScout team`,
      };
    case "withdrawn":
      return {
        subject: `Your opportunity has been taken down: ${opportunity.title}`,
        text: `${hello}\n\nWe have taken "${opportunity.title}" down from OppScout, so people no longer see it.${reason}\n\nIf something has changed, you can update it and save it to send it back for review: ${edit}\n\nThe OppScout team`,
      };
  }
}

/**
 * Tells the member who posted a listing about a review decision, by email to the contact address on the
 * post, and in their notification history when they also have a seeker profile. Catalogue listings (no
 * poster) are skipped. Never throws: a failed email must not undo or block the reviewer's decision.
 */
export async function notifyPoster(repository: Repository, opportunity: Opportunity, event: PosterEvent, note?: string | null, send = sendEmail): Promise<{ emailed: boolean }> {
  const contact = opportunity.submitterContact;
  if (!opportunity.submittedBy || !contact?.email) return { emailed: false };
  const message = posterUpdateMessage(event, opportunity, contact.name.split(" ")[0] || contact.name, note);
  let emailed = false;
  try {
    await send(contact.email, message.subject, message.text);
    emailed = true;
  } catch (error) {
    console.error("Could not email the poster about a review decision.", { opportunityId: opportunity.id, event, error: error instanceof Error ? error.message : "unknown" });
  }
  try {
    // Notification history belongs to seeker profiles; posters without one still get the email.
    if (await repository.getProfile(opportunity.submittedBy)) {
      await repository.createNotification({ userId: opportunity.submittedBy, matchId: null, channel: "email", status: emailed ? "sent" : "failed", triggerKey: `poster:${event}:${opportunity.id}`, message: message.subject });
    }
  } catch (error) {
    console.error("Could not record the poster notification.", { opportunityId: opportunity.id, error: error instanceof Error ? error.message : "unknown" });
  }
  return { emailed };
}
