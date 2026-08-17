import { z } from "zod";
import { ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseJson } from "@/lib/validation";
import { assertMonetizationReady, getMonetizationReadiness } from "@/services/monetization/readiness";
type Context = { params: Promise<{ id: string }> };
const schema = z.object({ subscriptionTier: z.enum(["free", "growth", "partner"]), monetizationEnabled: z.boolean() }).strict();
function assertScope(role: string, organizationId: string | null, id: string): void { if (role === "organization" && organizationId !== id) throw new ForbiddenError(); }
export async function GET(request: Request, context: Context): Promise<Response> { return apiHandler(async () => { const auth = await requireAuth(request); requireRole(auth, ["organization", "admin"]); const { id } = await context.params; assertScope(auth.role, auth.organizationId, id); const repository = await getRepository(); const organization = await repository.getOrganization(id); if (!organization) throw new NotFoundError("Organization"); return success(await getMonetizationReadiness(repository, organization)); }); }
export async function PATCH(request: Request, context: Context): Promise<Response> { return apiHandler(async () => { const auth = await requireAuth(request); requireRole(auth, ["admin"]); const { id } = await context.params; const input = await parseJson(request, schema); const repository = await getRepository(); const organization = await repository.getOrganization(id); if (!organization) throw new NotFoundError("Organization"); if (input.monetizationEnabled || input.subscriptionTier !== "free") await assertMonetizationReady(repository, organization); return success(await repository.updateOrganizationMonetization(id, { ...input, subscriptionStatus: input.monetizationEnabled ? "active" : "inactive" })); }); }
