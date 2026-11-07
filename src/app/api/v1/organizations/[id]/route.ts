import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { organizationEmailMatchesWebsite, organizationPatchSchema, parseJson } from "@/lib/validation";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { z } from "zod";

type Context = { params: Promise<{ id: string }> };

function assertScope(role: string, organizationId: string | null, id: string): void {
  if (role === "organization" && organizationId !== id) throw new ForbiddenError();
}

export async function GET(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    assertScope(auth.role, auth.organizationId, id);
    const organization = await (await getRepository()).getOrganization(id);
    if (!organization) throw new NotFoundError("Organization");
    return success(organization);
  });
}

export async function PATCH(request: Request, context: Context): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    assertScope(auth.role, auth.organizationId, id);
    const repository = await getRepository();
    const current = await repository.getOrganization(id);
    if (!current) throw new NotFoundError("Organization");
    const input = await parseJson(request, organizationPatchSchema.extend({
      registrationProofDocumentId: z.string().uuid().optional(),
    }).strict());
    const { registrationProofDocumentId, ...organizationInput } = input;
    const officialLinks = input.officialLinks ?? current.officialLinks;
    const officialEmail = input.officialEmail === undefined ? current.officialEmail : input.officialEmail;
    if (input.registrationProof !== undefined && !input.registrationProof?.trim()) {
      throw new ValidationError("Enter the organization's URSB registration number.");
    }
    if (registrationProofDocumentId) {
      const { data: proof, error } = await createServiceRoleClient().from("StoredDocument")
        .select("id")
        .eq("id", registrationProofDocumentId)
        .eq("ownerType", "user")
        .eq("ownerId", auth.userId)
        .eq("purpose", "registration_proof")
        .eq("status", "ready")
        .maybeSingle();
      if (error) throw new Error(`Could not verify URSB proof upload: ${error.message}`);
      if (!proof) throw new ForbiddenError();
    }
    const verificationDetailsChanged =
      (input.name !== undefined && input.name !== current.name) ||
      JSON.stringify(officialLinks) !== JSON.stringify(current.officialLinks) ||
      officialEmail !== current.officialEmail ||
      (organizationInput.registrationProof !== undefined && organizationInput.registrationProof !== current.registrationProof) ||
      registrationProofDocumentId !== undefined;
    if (verificationDetailsChanged && officialLinks.length > 0 && !organizationEmailMatchesWebsite(officialEmail, officialLinks)) {
      throw new ValidationError("When a website is supplied, use an official email address that matches its domain.");
    }
    const [primary, secondary] = input.accountableContacts ?? [];
    const updated = await repository.updateOrganization(id, {
      ...organizationInput,
      ...(input.accountableContacts ? {
        accountableContact: primary.name,
        additionalAccountableContact: secondary?.name ?? null,
        additionalAccountableContactPhone: secondary?.phone ?? null,
      } : {}),
    });
    if (auth.role === "organization" && verificationDetailsChanged && current.verificationStatus === "verified") {
      return success(await repository.reviewOrganization(id, false));
    }
    return success(updated);
  });
}
