import type { Opportunity } from "@/core/entities/domain";
import { visibilityFailures } from "@/services/trust/user-publication-policy";
import {
  candidateSchema, candidateToOpportunity, normalizedTitleKey, normalizeUrl, type SeedCandidate,
} from "@/services/seeding/candidate";
import { classifySource, hostOf, isAggregatorHost, isOfficialApplicationLink, isSocialHost, type SourceClassification } from "@/services/seeding/source-tiers";

export interface ExistingRecord {
  id: string;
  title: string;
  organizationId: string | null;
  organizationName: string | null;
  sourceUrl: string;
  deadline: Date | null;
  status: Opportunity["status"];
  verificationStatus: Opportunity["verificationStatus"];
  /** False for records approved with a partial checklist: they are invisible and need a full re-verification. */
  checklistComplete?: boolean;
}

export interface PipelineOptions {
  now: Date;
  existing: ExistingRecord[];
  /** Stage Tier B sources for human review, never as publication-ready records. */
  allowAggregatorLinksForReview?: boolean;
  /** Stage evidence-held records for human review, never as publication-ready records. */
  includeEvidenceHoldsForReview?: boolean;
  /** Hold anything closing sooner than this; users cannot act on it. */
  minLeadDays?: number;
  /** Evidence older than this was not gathered in this run. */
  maxEvidenceAgeDays?: number;
  /** A deadline further out than this is almost certainly a misread. */
  maxLeadDays?: number;
}

export type PipelineAction = "insert" | "recheck" | "update-changed";

export interface AcceptedRecord {
  index: number;
  candidate: SeedCandidate;
  classification: SourceClassification;
  action: PipelineAction;
  existingId: string | null;
  reviewOnly: boolean;
  warnings: string[];
}

export interface HeldRecord {
  index: number;
  title: string;
  stage: StageName;
  reasons: string[];
  raw: unknown;
}

export const STAGES = ["schema", "source", "evidence", "deadline", "duplicates", "visibility"] as const;
export type StageName = (typeof STAGES)[number];

export interface FunnelStep { stage: "received" | StageName; remaining: number }

export interface PipelineResult {
  accepted: AcceptedRecord[];
  held: HeldRecord[];
  funnel: FunnelStep[];
}

const DAY_MS = 86_400_000;
const PAYMENT_REQUEST = /(send|pay|transfer|deposit)\b.{0,40}\b(money|fee|payment|funds)|mobile money|bank (account|pin)|western union|password/i;

interface Work { index: number; raw: unknown; candidate?: SeedCandidate; classification?: SourceClassification; action?: PipelineAction; existingId?: string | null; reviewOnly?: boolean; aggregatorSourceOverride?: boolean; warnings: string[] }

export function runSeedingPipeline(rawCandidates: unknown[], options: PipelineOptions): PipelineResult {
  const { now, existing } = options;
  const minLead = options.minLeadDays ?? 14;
  const maxEvidenceAge = options.maxEvidenceAgeDays ?? 3;
  const maxLead = options.maxLeadDays ?? 540;
  const held: HeldRecord[] = [];
  const funnel: FunnelStep[] = [{ stage: "received", remaining: rawCandidates.length }];

  const hold = (work: Work, stage: StageName, reasons: string[]) =>
    held.push({ index: work.index, title: typeof (work.raw as { title?: unknown })?.title === "string" ? String((work.raw as { title: string }).title) : `(record ${work.index})`, stage, reasons, raw: work.raw });

  function stage(name: StageName, items: Work[], check: (work: Work) => string[]): Work[] {
    const next: Work[] = [];
    for (const work of items) {
      const reasons = check(work);
      if (reasons.length) hold(work, name, reasons); else next.push(work);
    }
    funnel.push({ stage: name, remaining: next.length });
    return next;
  }

  let items: Work[] = rawCandidates.map((raw, index) => ({ index, raw, warnings: [] }));

  items = stage("schema", items, (work) => {
    const parsed = candidateSchema.safeParse(work.raw);
    if (!parsed.success) return parsed.error.issues.map((issue) => `${issue.path.join(".") || "record"}: ${issue.message}`);
    work.candidate = parsed.data;
    return [];
  });

  items = stage("source", items, (work) => {
    const candidate = work.candidate!;
    const reasons: string[] = [];
    const classification = classifySource(candidate.sourceUrl, candidate.organizationOfficialDomain, candidate.organizationName);
    work.classification = classification;
    const applicationHost = hostOf(candidate.applicationUrl);
    const validOfficialApplication = isOfficialApplicationLink(candidate.applicationUrl, candidate.organizationOfficialDomain, candidate.organizationName);
    const validMiddlemanSource = classification.tier === "B" && !classification.homepageOnly && validOfficialApplication && applicationHost !== null && !isSocialHost(applicationHost) && !isAggregatorHost(applicationHost);
    const aggregatorForReview = options.allowAggregatorLinksForReview === true && classification.tier === "B" && !classification.homepageOnly;

    if (classification.tier !== "A" && !validMiddlemanSource && !aggregatorForReview) {
      reasons.push(`source is Tier ${classification.tier} (${classification.host ?? "invalid URL"}): ${classification.reason}`);
    }
    if (classification.homepageOnly) reasons.push("source URL is a homepage; it must be the page for this specific listing");
    if (!applicationHost) reasons.push("application URL is not public HTTPS");
    else if (isSocialHost(applicationHost)) reasons.push(`application link points at social media (${applicationHost})`);
    else if (isAggregatorHost(applicationHost) && !aggregatorForReview) reasons.push(`application link goes through an aggregator (${applicationHost}); use the provider's own application page`);
    if (validMiddlemanSource) {
      work.warnings.push("source is a middleman or aggregator, but the application page resolves to the provider's own domain and is still not a phishing or scam vector");
    }
    if (aggregatorForReview) {
      work.reviewOnly = true;
      work.warnings.push("Tier B aggregator source accepted for manual review only; verify the original listing and application route");
      if (!validMiddlemanSource) work.aggregatorSourceOverride = true;
    }
    if (classification.basis === "declared-official-domain") work.warnings.push(`official domain ${candidate.organizationOfficialDomain} is self-declared; confirm it at approval`);
    if (classification.basis === "employer-ats-board") work.warnings.push(`hosted on ${classification.host}; confirm it is ${candidate.organizationName}'s own board`);
    return reasons;
  });

  items = stage("evidence", items, (work) => {
    const candidate = work.candidate!;
    const reasons: string[] = [];
    if (candidate.unresolved.length) reasons.push(...candidate.unresolved.map((item) => `unresolved: ${item}`));
    if (candidate.ugandanEligibility === "unclear") reasons.push("Ugandan eligibility is unclear");
    if (candidate.ugandanEligibility === "excluded") reasons.push("Ugandans are excluded");
    if (candidate.feeAssessment === "suspicious") reasons.push("suspicious fee or payment request");
    if (candidate.asksSensitiveDataOffPlatform) reasons.push("asks for sensitive data outside the official application");
    if (candidate.feeAssessment === "none" && PAYMENT_REQUEST.test(`${candidate.description} ${candidate.applicationInstructions}`)) reasons.push("text mentions a payment or credential request although no fee was recorded");
    const retrieved = Date.parse(candidate.retrievedAt);
    if (now.getTime() - retrieved > maxEvidenceAge * DAY_MS) reasons.push(`evidence retrieved more than ${maxEvidenceAge} days ago`);
    if (retrieved - now.getTime() > 3_600_000) reasons.push("evidence retrieval time is in the future");
    if (reasons.length && options.includeEvidenceHoldsForReview && !work.aggregatorSourceOverride) {
      work.reviewOnly = true;
      work.warnings.push(`manual review required: ${reasons.join("; ")}`);
      return [];
    }
    return reasons;
  });

  items = stage("deadline", items, (work) => {
    const candidate = work.candidate!;
    if (candidate.deadlineType === "rolling" || !candidate.deadline) return [];
    const days = (Date.parse(candidate.deadline) - now.getTime()) / DAY_MS;
    if (days < minLead) return [`closes in ${Math.floor(days)} day(s); minimum lead time is ${minLead}`];
    if (days > maxLead) return [`deadline is ${Math.floor(days)} days away; likely a misread`];
    if (days < 30) work.warnings.push(`closes in ${Math.floor(days)} days; prefer 30 or more`);
    return [];
  });

  const seenUrls = new Map<string, number>();
  const seenTitles = new Map<string, number>();
  const byUrl = new Map(existing.map((record) => [normalizeUrl(record.sourceUrl), record]));
  const byTitle = new Map(existing.map((record) => [normalizedTitleKey(record.organizationName ?? "", record.title), record]));
  items = stage("duplicates", items, (work) => {
    const candidate = work.candidate!;
    const urlKey = normalizeUrl(candidate.sourceUrl);
    const titleKey = normalizedTitleKey(candidate.organizationName, candidate.title);
    const reasons: string[] = [];
    if (seenUrls.has(urlKey)) reasons.push(`duplicate of record ${seenUrls.get(urlKey)} in this run (same source URL)`);
    else if (seenTitles.has(titleKey)) reasons.push(`duplicate of record ${seenTitles.get(titleKey)} in this run (same organisation and title)`);
    if (reasons.length) return reasons;
    seenUrls.set(urlKey, work.index);
    seenTitles.set(titleKey, work.index);

    const sameUrl = byUrl.get(urlKey);
    const sameTitle = byTitle.get(titleKey);
    const live = (record: ExistingRecord) => ["open", "closing_soon"].includes(record.status) && (record.deadline === null || record.deadline > now);
    if (sameUrl) {
      // A timestamp refresh is only right for a record that is already approved and fully checked.
      // An approved-but-incomplete record (the old catalogue) must come back through approval.
      const unchanged = sameUrl.deadline?.getTime() === (candidate.deadline ? Date.parse(candidate.deadline) : undefined)
        && live(sameUrl) && sameUrl.verificationStatus === "verified" && sameUrl.checklistComplete !== false;
      work.action = unchanged && !work.reviewOnly ? "recheck" : "update-changed";
      work.existingId = sameUrl.id;
    } else if (sameTitle) {
      if (live(sameTitle)) {
        if (sameTitle.verificationStatus !== "verified" || sameTitle.checklistComplete === false) {
          work.action = "update-changed";
          work.existingId = sameTitle.id;
          return [];
        }
        return [`same organisation and title already live as ${sameTitle.id} under a different URL`];
      }
      work.action = "update-changed";
      work.existingId = sameTitle.id;
    } else {
      work.action = "insert";
      work.existingId = null;
    }
    return [];
  });

  items = stage("visibility", items, (work) => {
    if (work.reviewOnly) {
      work.warnings.push("manual review required: the publication checklist must be completed before approval");
      return [];
    }
    const probe = candidateToOpportunity(work.candidate!, {
      id: "00000000-0000-4000-8000-000000000000", organizationId: "00000000-0000-4000-8000-000000000001",
      now, reviewerId: "pipeline-visibility-probe", verificationStatus: "verified",
    });
    return visibilityFailures(probe, now);
  });

  const accepted: AcceptedRecord[] = items.map((work) => ({
    index: work.index, candidate: work.candidate!, classification: work.classification!, action: work.action!, existingId: work.existingId ?? null, reviewOnly: work.reviewOnly ?? false, warnings: work.warnings,
  }));
  return { accepted, held, funnel };
}
