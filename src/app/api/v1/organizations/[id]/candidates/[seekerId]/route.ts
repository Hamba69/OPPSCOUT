import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { ForbiddenError } from "@/core/errors/app-error";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(request: Request, context: { params: Promise<{ id: string; seekerId: string }> }): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["organization", "admin"]);
    const { id, seekerId } = await context.params;
    if (auth.role === "organization" && auth.organizationId !== id) throw new ForbiddenError();
    const db = createServiceRoleClient();
    const [{ data: org }, { data: profile }, { data: match }] = await Promise.all([
      db.from("Organization").select("name,verificationStatus").eq("id", id).maybeSingle(),
      db.from("UserProfile").select("id,name,email,phone,institution,fieldOfStudy,educationLevel,location,skills,dateOfBirth,githubUrl,portfolioUrl,otherLinks,projects,shareWithOrganizations,shareContactDetails").eq("id", seekerId).maybeSingle(),
      db.from("MatchResult").select("score,matchedFactors,missingFactors,Opportunity!inner(organizationId,status,verificationStatus)").eq("userId", seekerId).eq("Opportunity.organizationId", id).eq("Opportunity.status", "open").eq("Opportunity.verificationStatus", "verified").gte("score", Number(process.env.MATCH_RELEVANCE_THRESHOLD ?? 60)).order("score", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (org?.verificationStatus !== "verified" || !profile || !profile.shareWithOrganizations || !match) return Response.json({ error: { code: "NOT_FOUND", message: "Candidate not found." } }, { status: 404 });
    await db.from("SeekerAccessLog").insert({ organizationId: id, seekerId, action: "view_profile" });
    const dob = profile.dateOfBirth ? new Date(profile.dateOfBirth) : null;
    const now = new Date();
    const age = dob ? now.getUTCFullYear() - dob.getUTCFullYear() - ((now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())) ? 1 : 0) : 0;
    if (age < 18) return Response.json({ error: { code: "NOT_FOUND", message: "Candidate not found." } }, { status: 404 });
    const result: Record<string, unknown> = { seekerId, fullName: profile.name, institution: profile.institution, fieldOfStudy: profile.fieldOfStudy, educationLevel: profile.educationLevel, location: profile.location, score: match.score, matchedFactors: match.matchedFactors, missingFactors: match.missingFactors, topSkills: profile.skills?.slice(0, 5), githubUrl: profile.githubUrl, portfolioUrl: profile.portfolioUrl, otherLinks: profile.otherLinks, projects: profile.projects };
    if (profile.shareContactDetails) { result.email = profile.email; result.phone = profile.phone; }
    return success(result);
  });
}
