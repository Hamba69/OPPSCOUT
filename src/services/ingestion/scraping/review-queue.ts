import type { Repository, OpportunityInput } from "@/lib/repository/types";
import type { ShadowCandidate } from "@/services/ingestion/scraping/types";
import { findDuplicateOpportunity } from "@/services/ingestion/deduplication";

export interface CandidateQueueResult {
  queued: number;
  duplicates: number;
  needsReview: number;
}

function hostname(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function queueCandidatesForAdminReview(
  repository: Repository,
  candidates: ShadowCandidate[],
  now = new Date(),
): Promise<CandidateQueueResult> {
  const result: CandidateQueueResult = { queued: 0, duplicates: 0, needsReview: 0 };
  const verifiedOrganizations = (await repository.listOrganizations()).filter((organization) => organization.verificationStatus === "verified");
  for (const candidate of candidates) {
    const deadline = candidate.input.deadline ? new Date(candidate.input.deadline) : null;
    if (!candidate.applicationUrl || !deadline || deadline <= now) {
      result.needsReview += 1;
      continue;
    }
    const applicationHost = hostname(candidate.applicationUrl);
    if (!applicationHost) {
      result.needsReview += 1;
      continue;
    }
    const organization = verifiedOrganizations.find((item) => item.officialLinks.some((link) => {
      const officialHost = hostname(link);
      return officialHost !== null && (applicationHost === officialHost || applicationHost.endsWith(`.${officialHost}`));
    }));
    if (!organization) {
      result.needsReview += 1;
      continue;
    }

    const input: OpportunityInput = {
      ...candidate.input,
      deadline,
      organizationId: organization.id,
      sourceUrl: candidate.applicationUrl,
      source: "scraped",
      origin: "catalog",
      verificationStatus: "pending",
      status: "open",
    };
    if (await findDuplicateOpportunity(repository, input)) {
      result.duplicates += 1;
      continue;
    }
    await repository.createOpportunity(input);
    result.queued += 1;
  }
  return result;
}
