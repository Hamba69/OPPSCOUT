import { notFound } from "next/navigation";
import { requirePageAuth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function CandidatePage({ params }: { params: Promise<{ seekerId: string }> }): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const { seekerId } = await params;
  const db = createServiceRoleClient();
  const { data: profile } = await db.from("UserProfile").select("id,name,institution,fieldOfStudy,educationLevel,location,skills,githubUrl,portfolioUrl,otherLinks,projects,email,phone,dateOfBirth,shareWithOrganizations,shareContactDetails").eq("id", seekerId).maybeSingle();
  if (!profile || !profile.shareWithOrganizations) notFound();
  const { data: match } = await db.from("MatchResult").select("score,matchedFactors,missingFactors,Opportunity!inner(title,organizationId,status,verificationStatus)").eq("userId", seekerId).eq("Opportunity.organizationId", auth.organizationId!).eq("Opportunity.status", "open").eq("Opportunity.verificationStatus", "verified").gte("score", Number(process.env.MATCH_RELEVANCE_THRESHOLD ?? 60)).order("score", { ascending: false }).limit(1).maybeSingle();
  if (!match) notFound();
  await db.from("SeekerAccessLog").insert({ organizationId: auth.organizationId!, seekerId, action: "view_profile" });
  return <main className="page-shell animate-in"><h1 className="text-3xl font-extrabold text-ink">{profile.name}</h1><p className="mt-2 text-navy">{profile.institution} · {profile.fieldOfStudy} · {profile.location}</p><div className="mt-8 grid gap-4 md:grid-cols-2"><section className="card"><h2 className="font-extrabold text-ink">Match</h2><p className="mt-2 text-3xl font-extrabold text-leaf">{match.score}%</p><p className="mt-3 text-sm text-navy">Matched: {JSON.stringify(match.matchedFactors)}</p><p className="mt-2 text-sm text-navy">Missing: {JSON.stringify(match.missingFactors)}</p></section><section className="card"><h2 className="font-extrabold text-ink">Links and projects</h2><p className="mt-2 text-sm text-navy">{profile.githubUrl ?? profile.portfolioUrl ?? "No external links shared."}</p><p className="mt-3 text-sm text-navy">{(profile.projects ?? []).length} project(s) shared.</p>{profile.shareContactDetails && <p className="mt-3 text-sm text-navy">{profile.email ?? profile.phone ?? "No contact details provided."}</p>}</section></div></main>;
}
