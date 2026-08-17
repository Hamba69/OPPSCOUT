import type { EventLog, Opportunity, Organization, SavedOpportunity } from "@/core/entities/domain";
import type { Repository, StoredNotification } from "@/lib/repository/types";

export interface KpiMetric {
  key: string;
  label: string;
  value: number;
  unit: "count" | "percent" | "ratio";
  sampleSize: number;
}

export interface KpiSnapshot {
  generatedAt: string;
  periodDays: number;
  metrics: KpiMetric[];
}

function percent(numerator: number, denominator: number): number {
  return denominator ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
}

function metric(key: string, label: string, value: number, unit: KpiMetric["unit"], sampleSize: number): KpiMetric {
  return { key, label, value, unit, sampleSize };
}

function eventCount(events: EventLog[], type: EventLog["eventType"]): number {
  return events.filter((event) => event.eventType === type).length;
}

function organizationRepeatRate(organizations: Organization[]): number {
  const repeat = organizations.filter((organization) => organization.postingHistory.length > 1).length;
  return percent(repeat, organizations.length);
}

function deadlineSuccessRate(saved: SavedOpportunity[], opportunities: Opportunity[], now: Date): number {
  const deadlines = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity.deadline]));
  const decided = saved.filter((item) => item.status === "applied" || (deadlines.get(item.opportunityId)?.getTime() ?? Infinity) < now.getTime());
  return percent(decided.filter((item) => item.status === "applied").length, decided.length);
}

function notificationEngagement(events: EventLog[], notifications: StoredNotification[]): number {
  const delivered = notifications.filter((item) => item.status === "delivered" || item.status === "sent").length;
  const notificationClicks = events.filter((event) => event.eventType === "click" && event.metadata.source === "notification").length;
  return percent(notificationClicks, delivered);
}

export async function getKpiSnapshot(repository: Repository, now = new Date(), periodDays = 30): Promise<KpiSnapshot> {
  const since = new Date(now.getTime() - periodDays * 86_400_000);
  const [profiles, opportunities, organizations, notifications, events] = await Promise.all([
    repository.listProfiles(), repository.listOpportunities(), repository.listOrganizations(),
    repository.listAllNotifications(), repository.listEvents({ since }),
  ]);
  const [matchesByUser, savedByUser] = await Promise.all([
    Promise.all(profiles.map((profile) => repository.listMatches(profile.id))),
    Promise.all(profiles.map((profile) => repository.listSaved(profile.id))),
  ]);
  const matches = matchesByUser.flat();
  const saved = savedByUser.flat();
  const activeUserIds = new Set(events.flatMap((event) => event.userId ? [event.userId] : []));
  const views = eventCount(events, "view");
  const saves = eventCount(events, "save");
  const applyIntents = eventCount(events, "apply_intent");
  const clicks = eventCount(events, "click");
  const completedProfiles = profiles.filter((profile) => profile.profileCompletenessScore >= 80).length;
  const ussdActive = profiles.filter((profile) => profile.preferredChannel === "ussd" && activeUserIds.has(profile.id)).length;

  return {
    generatedAt: now.toISOString(),
    periodDays,
    metrics: [
      metric("registered_users", "Registered users", profiles.length, "count", profiles.length),
      metric("completed_profiles", "Completed matching profiles", percent(completedProfiles, profiles.length), "percent", profiles.length),
      metric("verified_opportunities", "Verified opportunities", opportunities.filter((item) => item.verificationStatus === "verified").length, "count", opportunities.length),
      metric("opportunity_user_match_rate", "Opportunity-to-user match rate", profiles.length ? Number((matches.length / profiles.length).toFixed(2)) : 0, "ratio", profiles.length),
      metric("opportunity_ctr", "Opportunity click-through rate", percent(clicks, views), "percent", views),
      metric("save_application_rate", "Save and application-intent rate", percent(saves + applyIntents, views), "percent", views),
      metric("notification_engagement", "Notification engagement rate", notificationEngagement(events, notifications), "percent", notifications.length),
      metric("ussd_active_users", "USSD active users", ussdActive, "count", activeUserIds.size),
      metric("deadline_success", "Application deadline success rate", deadlineSuccessRate(saved, opportunities, now), "percent", saved.length),
      metric("organization_retention", "Organization repeat posting rate", organizationRepeatRate(organizations), "percent", organizations.length),
    ],
  };
}
