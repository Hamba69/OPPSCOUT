import { apiHandler, success } from "@/lib/api";
import { ForbiddenError } from "@/core/errors/app-error";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { organizationSubmissionSchema, parseJson } from "@/lib/validation";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["user", "organization", "admin"]);
    if (auth.organizationId) throw new ForbiddenError();
    const input = await parseJson(request, organizationSubmissionSchema);
    if (input.registrationProofDocumentId) {
      const { data: proof, error } = await createServiceRoleClient().from("StoredDocument")
        .select("id")
        .eq("id", input.registrationProofDocumentId)
        .eq("ownerType", "user")
        .eq("ownerId", auth.userId)
        .eq("purpose", "registration_proof")
        .eq("status", "ready")
        .maybeSingle();
      if (error) throw new Error(`Could not verify registration proof upload: ${error.message}`);
      if (!proof) throw new ForbiddenError();
    }
    const [primary, secondary] = input.accountableContacts;
    return success(await (await getRepository()).createOrganization({
      name: input.name,
      sector: input.sector,
      officialLinks: input.officialLinks,
      officialEmail: input.officialEmail,
      registrationProof: input.registrationProof,
      accountableContacts: input.accountableContacts,
      accountableContact: primary.name,
      additionalAccountableContact: secondary?.name ?? null,
      additionalAccountableContactPhone: secondary?.phone ?? null,
      dashboardUsers: [auth.userId],
    }), 201);
  });
}
