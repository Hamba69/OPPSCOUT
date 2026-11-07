import "server-only";

import type { Organization } from "@/core/entities/domain";
import { isPublicHttpsUrl, organizationEmailMatchesWebsite } from "@/lib/validation";

export async function publisherCanPost(organization: Organization): Promise<boolean> {
  if (
    organization.verificationStatus !== "verified" ||
    !organization.registrationProof?.trim() ||
    !organization.officialLinks.every(isPublicHttpsUrl) ||
    !organization.officialEmail?.trim() ||
    (organization.officialLinks.length > 0 && !organizationEmailMatchesWebsite(organization.officialEmail, organization.officialLinks)) ||
    !organization.dashboardUsers.length
  ) return false;

  return true;
}
