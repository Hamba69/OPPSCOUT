import type { Opportunity } from "@/core/entities/domain";
import type { MatchEngine } from "@/core/interfaces/match-engine";
import type { Repository, StoredMatchResult } from "@/lib/repository/types";
import { evaluateHardGates } from "@/services/matching/rule-based/hard-gates";
import { resolveMatchEngine } from "@/services/matching/engine-selector";

export interface RankedMatch extends StoredMatchResult {
  urgencyRank: number;
}

function deadlineUrgency(opportunity: Opportunity, currentTime: Date): number {
  const hours = (opportunity.deadline.getTime() - currentTime.getTime()) / 3_600_000;
  if (hours <= 0) return -1;
  if (hours <= 24) return 3;
  if (hours <= 72) return 2;
  if (hours <= 168) return 1;
  return 0;
}

export async function buildRankedFeed(repository: Repository, userId: string, now = new Date(), engine: MatchEngine = resolveMatchEngine()): Promise<RankedMatch[]> {
  const profile = await repository.getProfile(userId);
  if (!profile) return [];
  const opportunities = await repository.listOpportunities({ verificationStatus: "verified", statuses: ["open", "closing_soon"] });
  const matches: RankedMatch[] = [];

  for (const opportunity of opportunities) {
    if (opportunity.deadline <= now) continue;
    const gates = evaluateHardGates(profile, opportunity);
    if (!gates.eligible) continue;
    const result = await engine.score(profile, opportunity);
    result.matchedFactors.unshift(...gates.passed);
    const stored = await repository.upsertMatch({ userId, opportunityId: opportunity.id, ...result });
    matches.push({ ...stored, opportunity, urgencyRank: deadlineUrgency(opportunity, now) });
  }

  return matches.sort((a, b) => b.score - a.score || b.urgencyRank - a.urgencyRank || a.opportunity!.deadline.getTime() - b.opportunity!.deadline.getTime());
}
