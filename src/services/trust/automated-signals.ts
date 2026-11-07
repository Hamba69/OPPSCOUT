import type { OpportunityInput, Repository } from "@/lib/repository/types";
import { isPublicHttpsUrl } from "@/lib/validation";
import { findDuplicateOpportunity } from "@/services/ingestion/deduplication";
import { containsSuspiciousRequest } from "@/services/trust/checklist";

export interface AutomatedTrustAssessment { risk: "low" | "review" | "high"; signals: string[]; duplicateOpportunityId: string | null; }
export async function assessAutomatedTrust(repository: Repository, input: OpportunityInput): Promise<AutomatedTrustAssessment> {
  const signals: string[] = [];
  const content = `${input.title} ${input.description} ${input.applicationMethod} ${input.eligibility.additionalRequirements?.join(" ") ?? ""}`;
  if (containsSuspiciousRequest(content)) signals.push("The listing requests payment or sensitive information.");
  if (!isPublicHttpsUrl(input.sourceUrl)) signals.push("The application link is not a public HTTPS URL.");
  if (!input.deadline) signals.push("The listing has no explicit closing date.");
  else if (input.deadline <= new Date()) signals.push("The listed deadline has passed.");
  const geographicText = `${input.location} ${content}`.toLowerCase();
  const ugandaMentioned = /\buganda\b|\bugandan\b|\bkampala\b|\bentebbe\b|\bjinja\b|\bmbarara\b|\bgulu\b|\bmbale\b|\barua\b|\blira\b|\bmasaka\b|\bhoima\b|\bsoroti\b|\bkabale\b/.test(geographicText);
  if (input.workMode === "remote" && !ugandaMentioned) {
    signals.push("Remote availability for applicants based in Uganda is not explicit.");
  } else if (input.workMode !== "remote" && !ugandaMentioned) {
    signals.push("The listing does not clearly identify a Uganda-based duty station or eligibility.");
  }
  const duplicate = await findDuplicateOpportunity(repository, input); if (duplicate) signals.push("A likely duplicate already exists.");
  return { risk: signals.some((item) => item.includes("payment") || item.includes("sensitive")) ? "high" : signals.length ? "review" : "low", signals, duplicateOpportunityId: duplicate?.id ?? null };
}
