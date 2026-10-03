import { SLO_TARGETS } from "@/config/slo-targets";
import { deferTelemetry } from "@/lib/telemetry";
import { getRepository } from "@/lib/repository";
import type { RequestMetricInput } from "@/lib/admin-data";
import type { Repository } from "@/lib/repository/types";


export function recordApiSample(input: RequestMetricInput): void {
  deferTelemetry(async () => { await (await getRepository()).writeRequestMetric(input); });
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
  ussdCompletion: { value: number | null; target: number; samples: number };
}

export async function getSloSnapshot(repository: Repository): Promise<SloSnapshot> {
  const { headlines: h } = await repository.adminSnapshot(new Date(Date.now()-30*86400000),new Date());
  const n=(key: string)=>Number(h[key]??0);
  return {
    generatedAt: new Date().toISOString(),
    apiUptime: { value: rate(n("apiOk"),n("apiSamples")), target: SLO_TARGETS.coreApi.target, samples: n("apiSamples") },
    notificationDelivery: { value: rate(n("delivered"),n("notifications")), target: SLO_TARGETS.notificationDelivery.target, samples: n("notifications") },
    dataFreshness: { value: rate(n("fresh"),n("opportunities")), target: SLO_TARGETS.dataFreshness.target, samples: n("opportunities") },
    matchRelevance: { value: rate(n("saves")+n("clicks"),n("views")), target: null, samples: n("views") },
    trustTurnaround: { value: h.reviewHours, target: SLO_TARGETS.trustTurnaround.target, samples: n("reviewed") },
    ussdCompletion: { value: rate(n("ussdOk"),n("ussdSamples")), target: SLO_TARGETS.ussdCompletion.target, samples: n("ussdSamples") },
  };
}
