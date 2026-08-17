import { INGESTION_RULES } from "@/config/ingestion-rules";
import type { Opportunity } from "@/core/entities/domain";
import type { OpportunityInput, Repository } from "@/lib/repository/types";
import { normalize } from "@/services/matching/rule-based/normalize";

function bigrams(value: string): Set<string> {
  const normalized = normalize(value);
  if (normalized.length < 2) return new Set([normalized]);
  return new Set(Array.from({ length: normalized.length - 1 }, (_, index) => normalized.slice(index, index + 2)));
}

export function titleSimilarity(left: string, right: string): number {
  const a = bigrams(left);
  const b = bigrams(right);
  if (!a.size && !b.size) return 1;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return (2 * intersection) / (a.size + b.size);
}

export async function findDuplicateOpportunity(repository: Repository, input: OpportunityInput): Promise<Opportunity | null> {
  const candidates = await repository.listOpportunities({ organizationId: input.organizationId });
  const windowMs = INGESTION_RULES.duplicateDeadlineWindowDays * 86_400_000;
  return candidates.find((candidate) =>
    Math.abs(candidate.deadline.getTime() - input.deadline.getTime()) <= windowMs &&
    titleSimilarity(candidate.title, input.title) >= INGESTION_RULES.duplicateTitleSimilarity
  ) ?? null;
}
