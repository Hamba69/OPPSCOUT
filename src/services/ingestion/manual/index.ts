import type { Opportunity } from "@/core/entities/domain";
import { SOURCE_AUTHORITY } from "@/config/ingestion-rules";
import type { OpportunityInput, Repository } from "@/lib/repository/types";
import { containsSuspiciousRequest } from "@/services/trust/checklist";
import { findDuplicateOpportunity } from "@/services/ingestion/deduplication";

export async function ingestManualOpportunity(repository: Repository, input: OpportunityInput): Promise<Opportunity> {
  const origin = input.origin ?? "catalog";
  const suspicious = containsSuspiciousRequest(`${input.title} ${input.description} ${input.applicationMethod}`);
  const duplicate = await findDuplicateOpportunity(repository, { ...input, origin });
  if (duplicate) {
    const incomingIsAuthoritative = SOURCE_AUTHORITY[input.source] >= SOURCE_AUTHORITY[duplicate.source];
    const lastSeenAt = new Date();
    if (!incomingIsAuthoritative && !suspicious) {
      return repository.updateOpportunity(duplicate.id, { lastSeenAt });
    }
    const applicationLinkChanged =
      input.applicationMethod !== duplicate.applicationMethod || input.sourceUrl !== duplicate.sourceUrl;
    return repository.updateOpportunity(duplicate.id, {
      ...(incomingIsAuthoritative ? input : {}),
      lastSeenAt,
      needsRecheck: suspicious || applicationLinkChanged,
      verificationStatus: suspicious || duplicate.verificationStatus === "flagged"
        ? "flagged"
        : duplicate.verificationStatus === "verified" && !applicationLinkChanged
          ? "verified"
          : "pending",
    });
  }
  return repository.createOpportunity({
    ...input,
    origin,
    source: input.source,
    verificationStatus: suspicious ? "flagged" : "pending",
    status: "open",
    checkedAt: new Date(),
    lastSeenAt: new Date(),
    needsRecheck: suspicious,
  });
}
