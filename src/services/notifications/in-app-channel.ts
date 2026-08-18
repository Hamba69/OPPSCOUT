import type { DeliveryStatus, NotificationChannel, NotificationPayload } from "@/core/interfaces/notification-channel";

export class InAppNotificationChannel implements NotificationChannel {
  public async send(payload: NotificationPayload): Promise<DeliveryStatus> { void payload; return "delivered"; }
}
