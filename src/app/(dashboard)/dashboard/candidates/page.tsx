import Link from "next/link";

import { requirePageAuth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function CandidatesPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const db = createServiceRoleClient();
  const { data: rows } = await db
    .from("MatchResult")
    .select("userId,score,Opportunity!inner(id,title,organizationId,status,verificationStatus),UserProfile!inner(name,institution,fieldOfStudy,educationLevel,location,skills,shareWithOrganizations,dateOfBirth)")
    .eq("Opportunity.organizationId", auth.organizationId!)
    .eq("Opportunity.status", "open")
    .eq("Opportunity.verificationStatus", "verified")
    .eq("UserProfile.shareWithOrganizations", true)
    .gte("score", Number(process.env.MATCH_RELEVANCE_THRESHOLD ?? 60))
    .order("score", { ascending: false })
    .limit(25);
  const candidates = rows ?? [];

  return (
    <main className="page-shell animate-in">
      <header className="page-header">
        <div>
          <p className="eyebrow">Publisher workspace</p>
          <h1 className="!text-left !font-extrabold">Matches</h1>
          <p>People matching your open, verified opportunities.</p>
        </div>
        <span className="pill">{candidates.length} profiles</span>
      </header>

      <section aria-label="Matching profiles" className="grid gap-4 xl:grid-cols-2">
        {candidates.map((row) => {
          const profile = Array.isArray(row.UserProfile) ? row.UserProfile[0] : row.UserProfile;
          const opportunity = Array.isArray(row.Opportunity) ? row.Opportunity[0] : row.Opportunity;
          const [firstName = "", ...rest] = String(profile?.name ?? "").split(/\s+/);
          const displayName = `${firstName} ${rest.at(-1)?.charAt(0).toUpperCase() ?? ""}.`;

          return (
            <article className="overflow-hidden rounded-2xl border border-ink/[.08] bg-white shadow-soft" key={`${row.userId}-${opportunity?.id}`}>
              <div className="flex items-start justify-between gap-4 border-b border-ink/[.08] px-5 py-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-extrabold text-ink">{displayName}</h2>
                  <p className="mt-1 truncate text-sm text-navy">{profile?.institution ?? "Institution not provided"}</p>
                </div>
                <span className="badge-verified shrink-0">{row.score}% match</span>
              </div>
              <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-navy">Field of study</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{profile?.fieldOfStudy ?? "Not provided"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-navy">Location</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{profile?.location ?? "Not provided"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-navy">Matched opportunity</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink">{opportunity?.title ?? "Open opportunity"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-navy">Skills</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink">{(profile?.skills ?? []).slice(0, 5).join(" · ") || "No skills listed"}</p>
                </div>
              </div>
              <div className="flex justify-end border-t border-ink/[.08] bg-cream/40 px-5 py-3">
                <Link className="button-secondary" href={`/dashboard/candidates/${row.userId}`}>View shared profile</Link>
              </div>
            </article>
          );
        })}
        {!candidates.length && (
          <section className="rounded-2xl border border-dashed border-ink/20 bg-white px-6 py-10 text-center xl:col-span-2">
            <h2 className="text-lg font-extrabold text-ink">No matches yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-navy">
              Profiles appear here when someone matches an open, verified opportunity and has opted to share their information.
            </p>
            <Link className="button-secondary mt-4" href="/dashboard/opportunities">Review your opportunities</Link>
          </section>
        )}
      </section>
    </main>
  );
}
