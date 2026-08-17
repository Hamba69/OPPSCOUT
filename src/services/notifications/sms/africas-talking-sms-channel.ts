import { AppError } from "@/core/errors/app-error";
import type { DeliveryStatus, NotificationChannel, NotificationPayload } from "@/core/interfaces/notification-channel";
import type { RecipientResolver } from "@/services/notifications/email/resend-email-channel";

export class AfricasTalkingSmsChannel implements NotificationChannel {
  public constructor(private readonly resolveRecipient: RecipientResolver) {}

  public async send(payload: NotificationPayload): Promise<DeliveryStatus> {
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;
    const recipient = await this.resolveRecipient(payload.userId);
    if (!apiKey || !username) throw new AppError("SMS provider is not configured.", 503, "SMS_NOT_CONFIGURED");
    if (!recipient) throw new AppError("The user has no phone number.", 422, "SMS_RECIPIENT_MISSING");

    const body = new URLSearchParams({ username, to: recipient, message: payload.message });
    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: { apiKey, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new AppError("SMS delivery provider rejected the message.", 502, "SMS_PROVIDER_ERROR", { status: response.status, detail });
    }
    return "sent";
  }
}
