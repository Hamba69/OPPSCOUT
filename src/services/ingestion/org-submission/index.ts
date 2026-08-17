import type { Opportunity } from "@/core/entities/domain";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";
import type { OpportunityInput, Repository } from "@/lib/repository/types";
import { ingestManualOpportunity } from "@/services/ingestion/manual";

export async function submitOrganizationOpportunity(
  repository: Repository,
  staffUserId: string,
  input: OpportunityInput,
): Promise<Opportunity> {
  const organization = await repository.getOrganization(input.organizationId);
  if (!organization || !organization.dashboardUsers.includes(staffUserId)) throw new ForbiddenError();
  if (!input.sourceUrl.startsWith("https://")) throw new ValidationError("An official HTTPS source URL is required.");
  return ingestManualOpportunity(repository, input);
}
