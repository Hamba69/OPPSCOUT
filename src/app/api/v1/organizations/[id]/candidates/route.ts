import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { ForbiddenError } from "@/core/errors/app-error";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id } = await context.params;
    if (auth.role === "organization" && auth.organizationId !== id) throw new ForbiddenError();
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = 25;
    const db = createServiceRoleClient();
    const { data: organization } = await db.from("Organization").select("verificationStatus").eq("id", id).maybeSingle();
    if (organization?.verificationStatus !== "verified" && auth.role !== "admin") throw new ForbiddenError();
    const { data: rows, error } = await db.from("MatchResult").select("score,matchedFactors,missingFactors,userId,opportunityId,UserProfile!inner(id,name,institution,fieldOfStudy,educationLevel,location,skills,dateOfBirth,shareWithOrganizations),Opportunity!inner(id,organizationId,status,verificationStatus)").eq("Opportunity.organizationId", id).eq("Opportunity.status", "open").eq("Opportunity.verificationStatus", "verified").eq("UserProfile.shareWithOrganizations", true).gte("score", Number(process.env.MATCH_RELEVANCE_THRESHOLD ?? 60)).order("score", { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(`Could not list candidates: ${error.message}`);
    const candidates = (rows ?? []).map((row) => ({ seekerId: row.userId, score: row.score, matchedFactors: row.matchedFactors, missingFactors: row.missingFactors, profile: row.UserProfile })).map((row) => {
      const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
      const [firstName = "", ...rest] = String(profile.name).trim().split(/\s+/);
      return { seekerId: row.seekerId, firstName, lastInitial: rest.at(-1)?.charAt(0).toUpperCase() ?? "", institution: profile.institution, fieldOfStudy: profile.fieldOfStudy, educationLevel: profile.educationLevel, location: profile.location, score: row.score, matchedFactors: row.matchedFactors, missingFactors: row.missingFactors, topSkills: (profile.skills ?? []).slice(0, 5) };
    });
    return success({ candidates, page, pageSize: limit });
  });
}
