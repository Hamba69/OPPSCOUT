import { requireAdminPortalApi } from "@/lib/admin-portal";
import { z } from "zod";

import { ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { isPublicHttpsUrl, organizationEmailMatchesWebsite, parseJson } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
const reviewSchema = z.object({
  approved: z.boolean(),
  overrideMissingRegistrationProof: z.boolean().optional(),
}).strict().superRefine((value, context) => {
  if (!value.approved && value.overrideMissingRegistrationProof) {
    context.addIssue({ code: "custom", path: ["overrideMissingRegistrationProof"], message: "Registration proof override only applies to verification." });
  }
});

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    requireAdminPortalApi(request);
    const { id } = await context.params;
    const { approved, overrideMissingRegistrationProof } = await parseJson(request, reviewSchema);
    const repository = await getRepository();
    const organization = await repository.getOrganization(id);
    if (!organization) throw new NotFoundError("Organization");
    if (approved) {
      if (!organization.officialLinks.every(isPublicHttpsUrl) ||
        !organization.officialEmail ||
        !z.string().email().safeParse(organization.officialEmail).success ||
        (organization.officialLinks.length > 0 && !organizationEmailMatchesWebsite(organization.officialEmail, organization.officialLinks))) {
        throw new ForbiddenError("The publisher must have a valid official email and, if provided, a matching public HTTPS website before verification.");
      }
      if (!organization.registrationProof?.trim() && !overrideMissingRegistrationProof) {
        throw new ForbiddenError("A URSB registration number is required unless you explicitly confirm manual verification.");
      }
    }
    return success(await repository.reviewOrganization(id, approved));
  });
}
