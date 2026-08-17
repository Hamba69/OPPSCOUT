import { notificationDailyCap, NOTIFICATION_RULES } from "@/config/notification-rules";
import type { NotificationChannel, NotificationPriority } from "@/core/interfaces/notification-channel";
import type { Repository, StoredMatchResult } from "@/lib/repository/types";

export interface ChannelRegistry {
  email: NotificationChannel;
  sms: NotificationChannel;
  ussd?: NotificationChannel;
}

export interface DeliveryAttempt {
  userId: string;
  opportunityId: string;
  triggerKey: string;
  status: "sent" | "delivered" | "failed" | "skipped";
  reason?: string;
}

function hoursUntil(date: Date, now: Date): number {
  return (date.getTime() - now.getTime()) / 3_600_000;
}

function deadlineWindow(hours: number): number | null {
  return NOTIFICATION_RULES.deadlineWindowsHours.find((window, index, all) => {
    const next = all[index + 1] ?? 0;
    return hours <= window && hours > next;
  }) ?? null;
}

async function deliver(
  repository: Repository,
  channels: ChannelRegistry,
  match: StoredMatchResult,
  triggerKey: string,
  priority: NotificationPriority,
  message: string,
): Promise<DeliveryAttempt> {
  const profile = await repository.getProfile(match.userId);
  if (!profile || !profile.notificationsEnabled) return { userId: match.userId, opportunityId: match.opportunityId, triggerKey, status: "skipped", reason: "notifications-disabled" };
  const kind = profile.preferredChannel === "ussd" ? "ussd" : profile.preferredChannel === "sms" ? "sms" : "email";
  const selected = channels[kind];
  if (!selected) return { userId: match.userId, opportunityId: match.opportunityId, triggerKey, status: "failed", reason: `${kind}-channel-not-configured` };
  const notification = await repository.createNotification({
    userId: match.userId,
    matchId: match.id,
    channel: kind,
    status: "sent",
    triggerKey,
    message,
  });
  try {
    const status = await selected.send({ userId: match.userId, matchId: match.id, message, priority });
    await repository.updateNotificationStatus(notification.id, status);
    return { userId: match.userId, opportunityId: match.opportunityId, triggerKey, status };
  } catch (error) {
    await repository.updateNotificationStatus(notification.id, "failed");
    return {
      userId: match.userId,
      opportunityId: match.opportunityId,
      triggerKey,
      status: "failed",
      reason: error instanceof Error ? error.message : "Unknown delivery failure",
    };
  }
}

export async function runNotificationScheduler(
  repository: Repository,
  channels: ChannelRegistry,
  userId: string,
  now = new Date(),
): Promise<DeliveryAttempt[]> {
  const matches = await repository.listMatches(userId);
  const saved = await repository.listSaved(userId);
  const savedIds = new Set(saved.filter((item) => item.status === "saved").map((item) => item.opportunityId));
  const recentSince = new Date(now.getTime() - NOTIFICATION_RULES.deduplicationWindowHours * 3_600_000);
  const recent = await repository.listRecentNotifications(userId, recentSince);
  const sentToday = recent.filter((item) => item.sentAt.toDateString() === now.toDateString() && item.status !== "failed").length;
  let remaining = Math.max(notificationDailyCap() - sentToday, 0);
  const attempts: DeliveryAttempt[] = [];

  for (const match of matches) {
    const opportunity = match.opportunity ?? await repository.getOpportunity(match.opportunityId);
    if (!opportunity || opportunity.deadline <= now) continue;
    const alreadySent = recent.some((item) => item.triggerKey.startsWith(`${opportunity.id}:`));
    if (alreadySent) {
      attempts.push({ userId, opportunityId: opportunity.id, triggerKey: `${opportunity.id}:deduplicated`, status: "skipped", reason: "48-hour-deduplication" });
      continue;
    }
    const window = deadlineWindow(hoursUntil(opportunity.deadline, now));
    const deadlineEligible = window !== null && (savedIds.has(opportunity.id) || match.score >= NOTIFICATION_RULES.reminderFitScore);
    const highFitEligible = match.score >= NOTIFICATION_RULES.highFitScore;
    if (!deadlineEligible && !highFitEligible) continue;
    if (remaining <= 0) {
      attempts.push({ userId, opportunityId: opportunity.id, triggerKey: `${opportunity.id}:daily-cap`, status: "skipped", reason: "daily-cap" });
      continue;
    }
    const triggerKey = deadlineEligible ? `${opportunity.id}:deadline:${window}` : `${opportunity.id}:high-fit`;
    const message = deadlineEligible
      ? `${opportunity.title} closes in about ${window} hours. Review it now: /opportunity/${opportunity.id} · Preferences: /settings`
      : `${opportunity.title} is a ${match.score}% match for you. See why: /opportunity/${opportunity.id} · Preferences: /settings`;
    attempts.push(await deliver(repository, channels, match, triggerKey, highFitEligible ? "high" : "normal", message));
    remaining -= 1;
  }
  return attempts;
}
