import { AI_RULES } from "@/config/ai-rules";
import { deferTelemetry } from "@/lib/telemetry";
import { matchTerms, scoreHistogram } from "@/services/matching/telemetry";
import { OrbitMatchEngine, ORBIT_ENGINE_VERSION } from "@/services/matching/orbit/engine";
import { AiAssistedMatchEngine, AI_ENGINE_VERSION } from "@/services/matching/ai-assisted/engine";
import { RULES_ENGINE_VERSION } from "@/services/matching/rule-based/engine";
import type { MatchRunInput, UnmatchedInput } from "@/lib/admin-data";
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
  telemetry?: boolean;
  trigger?: MatchRunInput["trigger"];
  opportunityIds?: ReadonlySet<string>;
}

export function recomputeRankedFeed(
  repository: Repository,
  userId: string,
  now = new Date(),
  engine: MatchEngine = resolveMatchEngine(),
): Promise<RankedMatch[]> {
  return buildRankedFeed(repository, userId, now, engine, { persist: true });
}

async function buildObservedFeed(
  repository: Repository,
  userId: string,
  now = new Date(),
  engine: MatchEngine = resolveMatchEngine(),
  options: RankedFeedOptions = {},
): Promise<RankedMatch[]> {
  const startedAt = performance.now();
  const profile = await repository.getProfile(userId);
  if (!profile) return [];
  const listedOpportunities = await repository.listOpportunities({ verificationStatus: "verified", statuses: ["open", "closing_soon"] });
  const opportunities = options.opportunityIds
    ? listedOpportunities.filter((opportunity) => options.opportunityIds!.has(opportunity.id))
    : listedOpportunities;
  const persistedMatches = options.persist === false
    ? new Map((await repository.listMatches(userId)).map((match) => [match.opportunityId, match]))
    : undefined;
  const evaluated = opportunities
    .filter((opportunity) => !opportunity.deadline || opportunity.deadline > now)
    .map((opportunity) => ({ opportunity, gates: evaluateHardGates(profile, opportunity) }));
  const eligible = evaluated.filter((item) => item.gates.eligible);
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

  if (options.telemetry !== false) {
    const exclusions: Record<string,number> = {};
    const missing: Record<string,number> = {};
    for (const item of evaluated) for (const factor of item.gates.failed) exclusions[factor.label]=(exclusions[factor.label]??0)+1;
    for (const item of scored) for (const factor of item.result.missingFactors) missing[factor.label]=(missing[factor.label]??0)+1;
    const kind = engine instanceof OrbitMatchEngine ? "orbit" : engine instanceof AiAssistedMatchEngine ? "ai" : "rules";
    const run: MatchRunInput = { userId, engine:kind, engineVersion:kind==="orbit"?ORBIT_ENGINE_VERSION:kind==="ai"?AI_ENGINE_VERSION:RULES_ENGINE_VERSION, trigger:options.trigger??"feed", durationMs:Math.round(performance.now()-startedAt), candidatesConsidered:opportunities.length, gateExcluded:evaluated.length-eligible.length, scored:scored.length, aboveThreshold:scored.filter(s=>s.result.score>=AI_RULES.relevanceThreshold).length, topScore:scored.length?Math.max(...scored.map(s=>s.result.score)):null, scoreHistogram:scoreHistogram(scored.map(s=>s.result.score)),gateExclusionReasons:exclusions,topMissingFactors:Object.fromEntries(Object.entries(missing).sort((a,b)=>b[1]-a[1]).slice(0,10)) };
    const terms = [...(matchTerms.getStore()?.values() ?? [])];
    deferTelemetry(()=>repository.writeMatchRun(run,terms));
  }
  return matches.sort((a, b) => {
    const score = b.score - a.score || b.urgencyRank - a.urgencyRank;
    if (score) return score;
    const left = a.opportunity!.deadline?.getTime() ?? Number.POSITIVE_INFINITY;
    const right = b.opportunity!.deadline?.getTime() ?? Number.POSITIVE_INFINITY;
    return left - right;
  });
}

export function buildRankedFeed(repository: Repository, userId: string, now = new Date(), engine: MatchEngine = resolveMatchEngine(), options: RankedFeedOptions = {}): Promise<RankedMatch[]> {
  return matchTerms.run(new Map<string,UnmatchedInput>(),()=>buildObservedFeed(repository,userId,now,engine,options));
}
