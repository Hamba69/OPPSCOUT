import type { DeliveryStatus, NotificationChannel, NotificationPayload } from "@/core/interfaces/notification-channel";

export class RecordingNotificationChannel implements NotificationChannel {
  public readonly payloads: NotificationPayload[] = [];

  public async send(payload: NotificationPayload): Promise<DeliveryStatus> {
    this.payloads.push(structuredClone(payload));
    return "delivered";
  }
}
