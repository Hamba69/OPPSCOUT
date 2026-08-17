import { AppError } from "@/core/errors/app-error";
import type { DeliveryStatus, NotificationChannel, NotificationPayload } from "@/core/interfaces/notification-channel";

export type RecipientResolver = (userId: string) => Promise<string | null>;

export class ResendEmailChannel implements NotificationChannel {
  public constructor(private readonly resolveRecipient: RecipientResolver) {}

  public async send(payload: NotificationPayload): Promise<DeliveryStatus> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.OPPSCOUT_EMAIL_FROM;
    const recipient = await this.resolveRecipient(payload.userId);
    if (!apiKey || !from) throw new AppError("Email provider is not configured.", 503, "EMAIL_NOT_CONFIGURED");
    if (!recipient) throw new AppError("The user has no email address.", 422, "EMAIL_RECIPIENT_MISSING");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [recipient], subject: "A helpful OppScout reminder", text: payload.message }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new AppError("Email delivery provider rejected the message.", 502, "EMAIL_PROVIDER_ERROR", { status: response.status, detail });
    }
    return "sent";
  }
}
