import { SLO_TARGETS } from "@/config/slo-targets";
import { INGESTION_RULES } from "@/config/ingestion-rules";
import type { Repository } from "@/lib/repository/types";

interface ApiSample {
  ok: boolean;
  durationMs: number;
  timestamp: Date;
}

const metricsGlobal = globalThis as unknown as { oppScoutApiSamples?: ApiSample[] };
const samples = metricsGlobal.oppScoutApiSamples ?? [];
metricsGlobal.oppScoutApiSamples = samples;

export function recordApiSample(ok: boolean, durationMs: number): void {
  samples.push({ ok, durationMs, timestamp: new Date() });
  if (samples.length > 10_000) samples.splice(0, samples.length - 10_000);
  console.info(JSON.stringify({ metric: "api_request", ok, durationMs, timestamp: new Date().toISOString() }));
}

function rate(success: number, total: number): number | null {
  return total ? Number(((success / total) * 100).toFixed(2)) : null;
}

export interface SloSnapshot {
  generatedAt: string;
  apiUptime: { value: number | null; target: number; samples: number };
  notificationDelivery: { value: number | null; target: number; samples: number };
  dataFreshness: { value: number | null; target: number; samples: number };
  matchRelevance: { value: number | null; target: null; samples: number };
  trustTurnaround: { value: number | null; target: number; samples: number };
}

export async function getSloSnapshot(repository: Repository): Promise<SloSnapshot> {
  const notificationRows = await repository.listAllNotifications();
  const opportunities = await repository.listOpportunities();
  const now = new Date();
  const freshnessCompliant = opportunities.filter((item) => {
    if (item.deadline <= now) return item.status === "closed" || item.status === "removed";
    const staleDays = item.source === "scraped" ? INGESTION_RULES.scrapedStaleAfterDays : INGESTION_RULES.organizationStaleAfterDays;
    const shouldBeStale = now.getTime() - item.checkedAt.getTime() > staleDays * 86_400_000;
    return shouldBeStale ? item.status === "stale" : item.status === "open" || item.status === "closing_soon";
  }).length;
  const events = await repository.listEvents();
  const views = events.filter((event) => event.eventType === "view").length;
  const engagements = events.filter((event) => event.eventType === "save" || event.eventType === "click").length;
  const reviewed = opportunities.filter((item) => item.reviewedAt);
  const reviewHours = reviewed.length
    ? Number((reviewed.reduce((sum, item) => sum + (item.reviewedAt!.getTime() - item.publicationDate.getTime()) / 3_600_000, 0) / reviewed.length).toFixed(2))
    : null;
  const delivered = notificationRows.filter((item) => item.status === "delivered" || item.status === "sent").length;
  return {
    generatedAt: new Date().toISOString(),
    apiUptime: { value: rate(samples.filter((item) => item.ok).length, samples.length), target: SLO_TARGETS.coreApi.target, samples: samples.length },
    notificationDelivery: { value: rate(delivered, notificationRows.length), target: SLO_TARGETS.notificationDelivery.target, samples: notificationRows.length },
    dataFreshness: { value: rate(freshnessCompliant, opportunities.length), target: SLO_TARGETS.dataFreshness.target, samples: opportunities.length },
    matchRelevance: { value: rate(engagements, views), target: null, samples: views },
    trustTurnaround: { value: reviewHours, target: SLO_TARGETS.trustTurnaround.target, samples: reviewed.length },
  };
}
