import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { ForbiddenError } from "@/core/errors/app-error";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { parseJson } from "@/lib/validation";
import { z } from "zod";

const pipelineSchema = z.object({
  opportunityId: z.string().uuid(),
  seekerId: z.string().uuid(),
  stage: z.enum(["new", "shortlisted", "invited", "contacted", "not_a_fit"]).optional(),
  note: z.string().trim().max(500).nullable().optional(),
}).strict();

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    if (auth.role === "organization" && auth.organizationId !== id) throw new ForbiddenError();
    const db = createServiceRoleClient();
    const { data, error } = await db.from("SeekerPipelineEntry").select("*").eq("organizationId", id).order("updatedAt", { ascending: false });
    if (error) throw new Error(`Could not list pipeline entries: ${error.message}`);
    return success(data ?? []);
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    if (auth.role === "organization" && auth.organizationId !== id) throw new ForbiddenError();
    const input = await parseJson(request, pipelineSchema);
    const db = createServiceRoleClient();
    const { data: opportunity } = await db.from("Opportunity").select("id").eq("id", input.opportunityId).eq("organizationId", id).maybeSingle();
    if (!opportunity) throw new ForbiddenError();
    const { data, error } = await db.from("SeekerPipelineEntry").upsert({ organizationId: id, ...input, invitedAt: input.stage === "invited" ? new Date().toISOString() : null }, { onConflict: "organizationId,opportunityId,seekerId" }).select("*").single();
    if (error) throw new Error(`Could not update pipeline: ${error.message}`);
    return success(data);
  });
}
