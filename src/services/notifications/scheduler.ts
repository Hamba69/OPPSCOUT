import { notificationDailyCap, NOTIFICATION_RULES } from "@/config/notification-rules";
import { appUrl } from "@/config/app";
import type { PreferredChannel, UserProfile } from "@/core/entities/domain";
import type { NotificationChannel, NotificationPriority } from "@/core/interfaces/notification-channel";
import type { Repository, StoredMatchResult, StoredNotification } from "@/lib/repository/types";

export interface ChannelRegistry {
  app: NotificationChannel;
  email: NotificationChannel;
  sms: NotificationChannel;
  ussd?: NotificationChannel;
}

export interface DeliveryAttempt {
  userId: string;
  opportunityId: string;
  triggerKey: string;
  channel?: "app" | "email" | "sms" | "ussd";
  status: "sent" | "delivered" | "failed" | "skipped";
  reason?: string;
}

function hoursUntil(date: Date, now: Date): number { return (date.getTime() - now.getTime()) / 3_600_000; }

function deadlineWindow(hours: number): number | null {
  return NOTIFICATION_RULES.deadlineWindowsHours.find((window, index, all) => {
    const next = all[index + 1] ?? 0;
    return hours <= window && hours > next;
  }) ?? null;
}

function selectedChannels(profile: UserProfile): Array<keyof ChannelRegistry> {
  const normalized = (channel: PreferredChannel): keyof ChannelRegistry => channel === "web" ? "app" : channel;
  return [...new Set([profile.preferredChannel, ...profile.secondaryChannels].map(normalized))];
}

async function deliver(repository: Repository, channels: ChannelRegistry, match: StoredMatchResult, channel: keyof ChannelRegistry, triggerKey: string, priority: NotificationPriority, message: string): Promise<DeliveryAttempt> {
  const selected = channels[channel];
  if (!selected) return { userId: match.userId, opportunityId: match.opportunityId, triggerKey, channel, status: "failed", reason: `${channel}-channel-not-configured` };
  const notification = await repository.createNotification({ userId: match.userId, matchId: match.id, channel, status: "sent", triggerKey, message });
  try {
    const status = await selected.send({ userId: match.userId, matchId: match.id, message, priority });
    await repository.updateNotificationStatus(notification.id, status);
    return { userId: match.userId, opportunityId: match.opportunityId, triggerKey, channel, status };
  } catch (error) {
    await repository.updateNotificationStatus(notification.id, "failed");
    return { userId: match.userId, opportunityId: match.opportunityId, triggerKey, channel, status: "failed", reason: error instanceof Error ? error.message : "Unknown delivery failure" };
  }
}

function deliverToSelected(repository: Repository, channels: ChannelRegistry, profile: UserProfile, match: StoredMatchResult, triggerKey: string, priority: NotificationPriority, message: string): Promise<DeliveryAttempt[]> {
  return Promise.all(selectedChannels(profile).map((channel) => deliver(repository, channels, match, channel, triggerKey, priority, message)));
}

function digestDue(profile: UserProfile, recent: StoredNotification[], now: Date): boolean {
  const intervalDays = profile.notificationFrequency === "daily" ? 1 : 7;
  const since = new Date(now.getTime() - intervalDays * 86_400_000);
  return !recent.some((item) => item.sentAt >= since && item.status !== "failed" && (profile.notificationFrequency === "instant" || item.triggerKey.startsWith("digest:")));
}

export async function runNotificationScheduler(repository: Repository, channels: ChannelRegistry, userId: string, now = new Date()): Promise<DeliveryAttempt[]> {
  const profile = await repository.getProfile(userId);
  if (!profile || !profile.notificationsEnabled) return [];
  const matches = await repository.listMatches(userId);
  const saved = await repository.listSaved(userId);
  const savedIds = new Set(saved.filter((item) => item.status === "saved").map((item) => item.opportunityId));
  const recentSince = new Date(now.getTime() - Math.max(NOTIFICATION_RULES.deduplicationWindowHours, 24 * 7) * 3_600_000);
  const recent = await repository.listRecentNotifications(userId, recentSince);
  const sentToday = recent.filter((item) => item.sentAt.toDateString() === now.toDateString() && item.status !== "failed" && !item.triggerKey.startsWith("digest:")).length;
  let remaining = Math.max(notificationDailyCap() - sentToday, 0);
  const attempts: DeliveryAttempt[] = [];
  const publicUrl = appUrl();

  for (const match of matches) {
    const opportunity = await repository.getOpportunity(match.opportunityId) ?? match.opportunity;
    if (!opportunity || opportunity.deadline <= now) continue;
    const majorChange = savedIds.has(opportunity.id) && opportunity.checkedAt.getTime() > match.createdAt.getTime();
    const changeKey = `${opportunity.id}:major-change:${opportunity.checkedAt.toISOString()}`;
    if (majorChange && !recent.some((item) => item.triggerKey === changeKey && item.status !== "failed")) {
      attempts.push(...await deliverToSelected(repository, channels, profile, match, changeKey, "high", `${opportunity.title} changed after you saved it. Recheck the deadline and eligibility: ${publicUrl}/opportunity/${opportunity.id} · Preferences: ${publicUrl}/settings`));
      continue;
    }
    if (profile.notificationFrequency !== "instant") continue;
    const alreadySent = recent.some((item) => item.triggerKey.startsWith(`${opportunity.id}:`) && item.status !== "failed");
    if (alreadySent) { attempts.push({ userId, opportunityId: opportunity.id, triggerKey: `${opportunity.id}:deduplicated`, status: "skipped", reason: "48-hour-deduplication" }); continue; }
    const window = deadlineWindow(hoursUntil(opportunity.deadline, now));
    const deadlineEligible = window !== null && (savedIds.has(opportunity.id) || match.score >= NOTIFICATION_RULES.reminderFitScore);
    const optedIntoCategory = profile.opportunityCategories.length === 0 || profile.opportunityCategories.includes(opportunity.category);
    const highFitEligible = match.score >= NOTIFICATION_RULES.highFitScore && optedIntoCategory;
    if (!deadlineEligible && !highFitEligible) continue;
    const channelCount = selectedChannels(profile).length;
    if (remaining < channelCount) { attempts.push({ userId, opportunityId: opportunity.id, triggerKey: `${opportunity.id}:daily-cap`, status: "skipped", reason: "daily-cap" }); continue; }
    const triggerKey = deadlineEligible ? `${opportunity.id}:deadline:${window}` : `${opportunity.id}:high-fit`;
    const message = deadlineEligible ? `${opportunity.title} closes in about ${window} hours. Review it now: ${publicUrl}/opportunity/${opportunity.id} · Preferences: ${publicUrl}/settings` : `${opportunity.title} is a ${match.score}% match for you. See why: ${publicUrl}/opportunity/${opportunity.id} · Preferences: ${publicUrl}/settings`;
    attempts.push(...await deliverToSelected(repository, channels, profile, match, triggerKey, highFitEligible ? "high" : "normal", message));
    remaining -= channelCount;
  }

  if (!attempts.some((item) => item.status === "sent" || item.status === "delivered") && matches.length > 0 && digestDue(profile, recent, now)) {
    const top = matches.slice(0, 3);
    const first = top[0];
    if (first) {
      const message = `Your OppScout digest: ${top.map((item) => item.opportunity?.title ?? "Opportunity").join("; ")}. Open your ranked feed: ${publicUrl}/feed · Preferences: ${publicUrl}/settings`;
      const digestKey = `digest:${profile.notificationFrequency}:${now.toISOString().slice(0, 10)}`;
      attempts.push(...await deliverToSelected(repository, channels, profile, first, digestKey, "digest", message));
    }
  }
  return attempts;
}
