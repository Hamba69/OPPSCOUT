import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePageAuth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";

interface MatchFactorView {
  label: string;
  detail: string;
}

function getFactors(value: unknown): MatchFactorView[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is MatchFactorView =>
    typeof item === "object" && item !== null &&
    "label" in item && typeof item.label === "string" &&
    "detail" in item && typeof item.detail === "string",
  );
}

export const dynamic = "force-dynamic";

export default async function CandidatePage({ params }: { params: Promise<{ seekerId: string }> }): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const { seekerId } = await params;
  const db = createServiceRoleClient();
  const { data: profile } = await db
    .from("UserProfile")
    .select("id,name,institution,fieldOfStudy,educationLevel,location,skills,githubUrl,portfolioUrl,otherLinks,projects,email,phone,shareWithOrganizations,shareContactDetails")
    .eq("id", seekerId)
    .maybeSingle();
  if (!profile || !profile.shareWithOrganizations) notFound();

  const { data: match } = await db
    .from("MatchResult")
    .select("score,matchedFactors,missingFactors,Opportunity!inner(title,organizationId,status,verificationStatus)")
    .eq("userId", seekerId)
    .eq("Opportunity.organizationId", auth.organizationId!)
    .eq("Opportunity.status", "open")
    .eq("Opportunity.verificationStatus", "verified")
    .gte("score", Number(process.env.MATCH_RELEVANCE_THRESHOLD ?? 60))
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!match) notFound();

  await db.from("SeekerAccessLog").insert({ organizationId: auth.organizationId!, seekerId, action: "view_profile" });
  const matchedFactors = getFactors(match.matchedFactors);
  const missingFactors = getFactors(match.missingFactors);
  const opportunity = Array.isArray(match.Opportunity) ? match.Opportunity[0] : null;
  const links = [
    ...(profile.githubUrl ? [{ label: "GitHub", url: profile.githubUrl }] : []),
    ...(profile.portfolioUrl ? [{ label: "Portfolio", url: profile.portfolioUrl }] : []),
    ...(Array.isArray(profile.otherLinks) ? profile.otherLinks.filter((link): link is { label: string; url: string } =>
      typeof link === "object" && link !== null && "label" in link && typeof link.label === "string" && "url" in link && typeof link.url === "string",
    ) : []),
  ];

  return (
    <main className="page-shell animate-in">
      <Link href="/dashboard/candidates" className="mb-5 inline-flex text-sm font-semibold text-navy underline underline-offset-4 hover:text-ink">
        ← Back to matches
      </Link>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/[.08] bg-white p-5 shadow-soft">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy">Shared candidate profile</p>
          <h1 className="mt-1 !text-left !font-extrabold">{profile.name}</h1>
          <p className="mt-1 text-sm text-navy">
            {[profile.institution, profile.fieldOfStudy, profile.location].filter(Boolean).join(" · ") || "Profile details not provided"}
          </p>
        </div>
        <div className="rounded-2xl bg-leaf/10 px-4 py-3 text-center">
          <p className="text-2xl font-extrabold text-leaf">{match.score}%</p>
          <p className="text-xs font-semibold text-navy">match</p>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-ink/[.08] bg-white shadow-soft" aria-labelledby="match-breakdown-heading">
          <div className="border-b border-ink/[.08] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy">Opportunity</p>
            <h2 id="match-breakdown-heading" className="mt-1 text-lg font-extrabold text-ink">
              {opportunity?.title ?? "Open opportunity"}
            </h2>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-ink">Strong matches</h3>
              {matchedFactors.length ? (
                <ul className="mt-3 space-y-3">
                  {matchedFactors.map((factor, index) => (
                    <li key={`${factor.label}-${index}`} className="border-l-2 border-leaf pl-3">
                      <p className="text-sm font-semibold text-ink">{factor.label}</p>
                      <p className="mt-0.5 text-xs leading-5 text-navy">{factor.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-navy">No match details available.</p>}
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Consider reviewing</h3>
              {missingFactors.length ? (
                <ul className="mt-3 space-y-3">
                  {missingFactors.map((factor, index) => (
                    <li key={`${factor.label}-${index}`} className="border-l-2 border-honey pl-3">
                      <p className="text-sm font-semibold text-ink">{factor.label}</p>
                      <p className="mt-0.5 text-xs leading-5 text-navy">{factor.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-navy">No additional factors to review.</p>}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-ink/[.08] bg-white shadow-soft" aria-labelledby="profile-details-heading">
          <div className="border-b border-ink/[.08] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy">Candidate details</p>
            <h2 id="profile-details-heading" className="mt-1 text-lg font-extrabold text-ink">Education and skills</h2>
          </div>
          <dl className="grid gap-4 p-5 sm:grid-cols-2">
            <div><dt className="text-xs font-bold uppercase tracking-wide text-navy">Education level</dt><dd className="mt-1 text-sm font-semibold text-ink">{profile.educationLevel ?? "Not provided"}</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-wide text-navy">Field of study</dt><dd className="mt-1 text-sm font-semibold text-ink">{profile.fieldOfStudy ?? "Not provided"}</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-wide text-navy">Institution</dt><dd className="mt-1 text-sm font-semibold text-ink">{profile.institution ?? "Not provided"}</dd></div>
            <div><dt className="text-xs font-bold uppercase tracking-wide text-navy">Location</dt><dd className="mt-1 text-sm font-semibold text-ink">{profile.location ?? "Not provided"}</dd></div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wide text-navy">Skills</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {(profile.skills ?? []).length ? profile.skills.slice(0, 12).map((skill: string) => <span className="pill" key={skill}>{skill}</span>) : <span className="text-sm text-navy">No skills listed</span>}
              </dd>
            </div>
          </dl>
          <div className="border-t border-ink/[.08] px-5 py-4">
            <h3 className="text-sm font-bold text-ink">Shared links and projects</h3>
            {links.length ? (
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {links.map((link) => <li key={`${link.label}-${link.url}`}><a className="text-sm font-semibold text-navy underline underline-offset-4 hover:text-ink" href={link.url} target="_blank" rel="noreferrer">{link.label}</a></li>)}
              </ul>
            ) : <p className="mt-1 text-sm text-navy">No external links shared.</p>}
            <p className="mt-3 text-xs text-navy">{Array.isArray(profile.projects) ? profile.projects.length : 0} project(s) shared.</p>
            {profile.shareContactDetails && <p className="mt-3 border-t border-ink/[.08] pt-3 text-sm text-navy">{profile.email ?? profile.phone ?? "No contact details provided."}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
