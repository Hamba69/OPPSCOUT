import type { OpportunityInput, Repository } from "@/lib/repository/types";
import { findDuplicateOpportunity } from "@/services/ingestion/deduplication";
import { containsSuspiciousRequest } from "@/services/trust/checklist";

export interface AutomatedTrustAssessment { risk: "low" | "review" | "high"; signals: string[]; duplicateOpportunityId: string | null; }
export async function assessAutomatedTrust(repository: Repository, input: OpportunityInput): Promise<AutomatedTrustAssessment> {
  const signals: string[] = []; const content = `${input.title} ${input.description} ${input.applicationMethod}`;
  if (containsSuspiciousRequest(content)) signals.push("The listing requests payment or sensitive information.");
  if (!input.sourceUrl.startsWith("https://")) signals.push("The official source does not use HTTPS.");
  if (input.deadline <= new Date()) signals.push("The listed deadline has passed.");
  const duplicate = await findDuplicateOpportunity(repository, input); if (duplicate) signals.push("A likely duplicate already exists.");
  return { risk: signals.some((item) => item.includes("payment") || item.includes("sensitive")) ? "high" : signals.length ? "review" : "low", signals, duplicateOpportunityId: duplicate?.id ?? null };
}
