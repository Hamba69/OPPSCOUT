export type NotificationPriority = "high" | "normal" | "digest";

export interface NotificationPayload {
  userId: string;
  matchId?: string;
  message: string;
  priority: NotificationPriority;
}

export type DeliveryStatus = "sent" | "delivered" | "failed";

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<DeliveryStatus>;
}
