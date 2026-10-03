import type { Repository } from "@/lib/repository/types";

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

export async function getKpiSnapshot(repository: Repository, now = new Date(), periodDays = 30): Promise<KpiSnapshot> {
  const {headlines:h}=await repository.adminSnapshot(new Date(now.getTime()-periodDays*86400000),now);
  const n=(key:string)=>Number(h[key]??0);
  return {generatedAt:now.toISOString(),periodDays,metrics:[
    metric("registered_users","Registered users",n("users"),"count",n("users")),
    metric("completed_profiles","Completed matching profiles",percent(n("completeProfiles"),n("users")),"percent",n("users")),
    metric("verified_opportunities","Verified opportunities",n("verifiedOpportunities"),"count",n("opportunities")),
    metric("opportunity_user_match_rate","Opportunity-to-user match rate",n("users")?Number((n("matches")/n("users")).toFixed(2)):0,"ratio",n("users")),
    metric("opportunity_ctr","Opportunity click-through rate",percent(n("clicks"),n("views")),"percent",n("views")),
    metric("save_application_rate","Save and application-intent rate",percent(n("saves")+n("applyIntents"),n("views")),"percent",n("views")),
    metric("notification_engagement","Notification engagement rate",percent(n("notificationClicks"),n("delivered")),"percent",n("notifications")),
    metric("ussd_active_users","USSD active users",n("ussdActive"),"count",n("activeUsers")),
    metric("deadline_success","Application deadline success rate",percent(n("appliedSaves"),n("decidedSaves")),"percent",n("saved")),
    metric("organization_retention","Organization repeat posting rate",percent(n("repeatOrganizations"),n("postingOrganizations")),"percent",n("postingOrganizations")),
  ]};
}
