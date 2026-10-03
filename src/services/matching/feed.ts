import { randomUUID } from "node:crypto";

import type { Opportunity } from "@/core/entities/domain";
import type { MatchEngine } from "@/core/interfaces/match-engine";
import type { Repository, StoredMatchResult } from "@/lib/repository/types";
import { evaluateHardGates } from "@/services/matching/rule-based/hard-gates";
import { resolveMatchEngine } from "@/services/matching/engine-selector";

export interface RankedMatch extends StoredMatchResult {
  urgencyRank: number;
}

function deadlineUrgency(opportunity: Opportunity, currentTime: Date): number {
  if (!opportunity.deadline) return 0;
  const hours = (opportunity.deadline.getTime() - currentTime.getTime()) / 3_600_000;
  if (hours <= 0) return -1;
  if (hours <= 24) return 3;
  if (hours <= 72) return 2;
  if (hours <= 168) return 1;
  return 0;
}

export interface RankedFeedOptions {
  persist?: boolean;
}

export function recomputeRankedFeed(
  repository: Repository,
  userId: string,
  now = new Date(),
  engine: MatchEngine = resolveMatchEngine(),
): Promise<RankedMatch[]> {
  return buildRankedFeed(repository, userId, now, engine, { persist: true });
}

export async function buildRankedFeed(
  repository: Repository,
  userId: string,
  now = new Date(),
  engine: MatchEngine = resolveMatchEngine(),
  options: RankedFeedOptions = {},
): Promise<RankedMatch[]> {
  const profile = await repository.getProfile(userId);
  if (!profile) return [];
  const opportunities = await repository.listOpportunities({ verificationStatus: "verified", statuses: ["open", "closing_soon"] });
  const persistedMatches = options.persist === false
    ? new Map((await repository.listMatches(userId)).map((match) => [match.opportunityId, match]))
    : undefined;
  const eligible = opportunities
    .filter((opportunity) => !opportunity.deadline || opportunity.deadline > now)
    .map((opportunity) => ({ opportunity, gates: evaluateHardGates(profile, opportunity) }))
    .filter((item) => item.gates.eligible);
  const scored = await Promise.all(eligible.map(async ({ opportunity, gates }) => {
    const result = await engine.score(profile, opportunity);
    result.missingFactors.unshift(...(opportunity.eligibility.additionalRequirements ?? []).map(detail => ({ label: "Confirm eligibility with provider", detail })));
    result.matchedFactors.unshift(...gates.passed);
    return { opportunity, result };
  }));
  const matches = await Promise.all(scored.map(async ({ opportunity, result }) => {
    const stored = options.persist === false
      ? {
          id: persistedMatches?.get(opportunity.id)?.id ?? randomUUID(),
          userId,
          opportunityId: opportunity.id,
          ...result,
          createdAt: persistedMatches?.get(opportunity.id)?.createdAt ?? now,
        }
      : await repository.upsertMatch({ userId, opportunityId: opportunity.id, ...result });
    return { ...stored, opportunity, urgencyRank: deadlineUrgency(opportunity, now) };
  }));

  return matches.sort((a, b) => {
    const score = b.score - a.score || b.urgencyRank - a.urgencyRank;
    if (score) return score;
    const left = a.opportunity!.deadline?.getTime() ?? Number.POSITIVE_INFINITY;
    const right = b.opportunity!.deadline?.getTime() ?? Number.POSITIVE_INFINITY;
    return left - right;
  });
}
