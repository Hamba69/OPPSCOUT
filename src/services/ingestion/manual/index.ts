import type { Opportunity } from "@/core/entities/domain";
import { SOURCE_AUTHORITY } from "@/config/ingestion-rules";
import type { OpportunityInput, Repository } from "@/lib/repository/types";
import { containsSuspiciousRequest } from "@/services/trust/checklist";
import { findDuplicateOpportunity } from "@/services/ingestion/deduplication";

export async function ingestManualOpportunity(repository: Repository, input: OpportunityInput): Promise<Opportunity> {
  const suspicious = containsSuspiciousRequest(`${input.title} ${input.description} ${input.applicationMethod}`);
  const duplicate = await findDuplicateOpportunity(repository, input);
  if (duplicate) {
    const incomingIsAuthoritative = SOURCE_AUTHORITY[input.source] >= SOURCE_AUTHORITY[duplicate.source];
    return repository.updateOpportunity(duplicate.id, {
      ...(incomingIsAuthoritative ? input : {}),
      verificationStatus: suspicious ? "flagged" : duplicate.verificationStatus,
      checkedAt: new Date(),
    });
  }
  return repository.createOpportunity({
    ...input,
    source: "org_submitted",
    verificationStatus: suspicious ? "flagged" : "pending",
    status: "open",
    checkedAt: new Date(),
  });
}
