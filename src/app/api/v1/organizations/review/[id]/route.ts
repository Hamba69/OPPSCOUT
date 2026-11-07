import { requireAdminPortalApi } from "@/lib/admin-portal";
import { z } from "zod";

import { ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { isPublicHttpsUrl, organizationEmailMatchesWebsite, parseJson } from "@/lib/validation";

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
      if (!organization.officialLinks.every(isPublicHttpsUrl) ||
        !organization.officialEmail ||
        !z.string().email().safeParse(organization.officialEmail).success ||
        (organization.officialLinks.length > 0 && !organizationEmailMatchesWebsite(organization.officialEmail, organization.officialLinks)) ||
        !organization.registrationProof?.trim()) {
        throw new ForbiddenError("The publisher must have a valid official email, a valid optional website, and a URSB registration number before verification.");
      }
    }
    return success(await repository.reviewOrganization(id, approved));
  });
}
