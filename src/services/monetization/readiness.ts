import { MONETIZATION_RULES } from "@/config/monetization-rules";
import type { Organization } from "@/core/entities/domain";
import { AppError } from "@/core/errors/app-error";
import type { Repository } from "@/lib/repository/types";
import { getKpiSnapshot } from "@/services/kpi/dashboard";
import { getSloSnapshot } from "@/services/monitoring/metrics";

export interface MonetizationReadiness { ready: boolean; blockers: string[]; legalReviewReference: string | null; organizationRetentionPercent: number; trustTurnaroundHours: number | null; organizationSample: number; coreDiscoveryFree: true; }
export async function getMonetizationReadiness(repository: Repository, organization: Organization): Promise<MonetizationReadiness> {
  const [kpis, slos] = await Promise.all([getKpiSnapshot(repository), getSloSnapshot(repository)]); const retention = kpis.metrics.find((item) => item.key === "organization_retention")!; const blockers: string[] = [];
  if (!MONETIZATION_RULES.legalReviewReference) blockers.push("Legal review evidence is missing.");
  if (MONETIZATION_RULES.minimumOrganizationRetentionPercent === null) blockers.push("The retention threshold is not defined from real data."); else if (retention.value < MONETIZATION_RULES.minimumOrganizationRetentionPercent) blockers.push("Organization retention is below the approved threshold.");
  if (MONETIZATION_RULES.maximumTrustTurnaroundHours === null) blockers.push("The trust-turnaround threshold is not defined from real data."); else if (slos.trustTurnaround.value === null || slos.trustTurnaround.value > MONETIZATION_RULES.maximumTrustTurnaroundHours) blockers.push("Trust turnaround is not proven healthy.");
  if (MONETIZATION_RULES.minimumOrganizationSample === null) blockers.push("The minimum retention sample is not defined."); else if (retention.sampleSize < MONETIZATION_RULES.minimumOrganizationSample) blockers.push("The retention sample is too small.");
  if (organization.verificationStatus !== "verified") blockers.push("The organization is not verified.");
  return { ready: blockers.length === 0, blockers, legalReviewReference: MONETIZATION_RULES.legalReviewReference, organizationRetentionPercent: retention.value, trustTurnaroundHours: slos.trustTurnaround.value, organizationSample: retention.sampleSize, coreDiscoveryFree: true };
}
export async function assertMonetizationReady(repository: Repository, organization: Organization): Promise<void> { const readiness = await getMonetizationReadiness(repository, organization); if (!readiness.ready) throw new AppError("Monetization activation is blocked.", 409, "MONETIZATION_NOT_READY", readiness); }
