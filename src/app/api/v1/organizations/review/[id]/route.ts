import { requireAdminPortalApi } from "@/lib/admin-portal";
import { z } from "zod";

import { ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { isPublicHttpsUrl, organizationEmailMatchesWebsite, parseJson } from "@/lib/validation";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };
const reviewSchema = z.object({ approved: z.boolean() }).strict();

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    requireAdminPortalApi(request);
    const { id } = await context.params;
    const { approved } = await parseJson(request, reviewSchema);
    const repository = await getRepository();
    const organization = await repository.getOrganization(id);
    if (!organization) throw new NotFoundError("Organization");
    if (approved) {
      if (!organization.officialLinks.length ||
        !organization.officialLinks.every(isPublicHttpsUrl) ||
        !organizationEmailMatchesWebsite(organization.officialEmail, organization.officialLinks) ||
        !organization.registrationProof?.trim()) {
        throw new ForbiddenError("The publisher must have a matching official email, website and URSB registration number before verification.");
      }
      const ownerIds = organization.dashboardUsers;
      const db = createServiceRoleClient();
      const proof = ownerIds.length
        ? await db.from("StoredDocument").select("id").eq("ownerType","user").eq("purpose","registration_proof").eq("status","ready").in("ownerId",ownerIds).order("createdAt",{ascending:false}).limit(1).maybeSingle()
        : { data: null, error: null };
      if (proof.error) throw new Error(`Could not verify URSB proof upload: ${proof.error.message}`);
      if (!proof.data) throw new ForbiddenError("Review the uploaded URSB registration document before verifying this publisher.");
    }
    return success(await repository.reviewOrganization(id, approved));
  });
}
