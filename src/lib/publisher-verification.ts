import "server-only";

import type { Organization } from "@/core/entities/domain";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isPublicHttpsUrl, organizationEmailMatchesWebsite } from "@/lib/validation";

export async function publisherCanPost(organization: Organization): Promise<boolean> {
  if (
    organization.verificationStatus !== "verified" ||
    !organization.registrationProof?.trim() ||
    !organization.officialLinks.length ||
    !organization.officialLinks.every(isPublicHttpsUrl) ||
    !organizationEmailMatchesWebsite(organization.officialEmail, organization.officialLinks) ||
    !organization.dashboardUsers.length
  ) return false;

  const { data, error } = await createServiceRoleClient().from("StoredDocument")
    .select("id")
    .eq("ownerType", "user")
    .eq("purpose", "registration_proof")
    .eq("status", "ready")
    .in("ownerId", organization.dashboardUsers)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Could not check publisher registration proof: ${error.message}`);
  return Boolean(data);
}
