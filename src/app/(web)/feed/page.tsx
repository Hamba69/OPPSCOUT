import { EmptyState } from "@/components/empty-state";
import { MatchCard } from "@/components/match-card";
import { requirePageAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile-store";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FeedPage(): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const profile = await getUserProfile(userId);
  if (!profile) redirect("/profile");

  const repository = await getRepository();
  const matches = await buildRankedFeed(repository, userId, new Date(), undefined, { persist: false });
  const now = new Date();
  return (
    <main className="page-shell animate-in">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Fresh picks for {profile?.name ?? "you"}</p><h1 className="mt-2 text-4xl font-black">Matches worth your time.</h1><p className="mt-2 text-ink/60">Eligibility checked. Sources verified. Reasons included.</p></div><span className="pill">{matches.length} clear matches</span></div>
      {matches.length ? <div className="mt-8 grid gap-5 md:grid-cols-2">{matches.map((match) => {
        const opportunity = match.opportunity!;
        const daysLeft = opportunity.deadline ? Math.ceil((opportunity.deadline.getTime() - now.getTime()) / 86_400_000) : null;
        return <MatchCard daysLeft={daysLeft} key={match.id} id={match.id} opportunityId={opportunity.id} title={opportunity.title} organization={opportunity.organization?.name ?? "Verified organization"} score={match.score} deadline={opportunity.deadline?.toISOString() ?? null} location={opportunity.location} workMode={opportunity.workMode} matched={match.matchedFactors} missing={match.missingFactors} sourceUrl={opportunity.sourceUrl} checkedAt={opportunity.checkedAt.toISOString()} publicationDate={opportunity.publicationDate.toISOString()} />;
      })}</div> : <div className="mt-8"><EmptyState symbol="🌱" title="No clear matches yet" description="Add your study field, a few skills, and the places you would like to work. A little more about you helps us find a clearer fit." href="/profile" action="Complete your profile" /></div>}
    </main>
  );
}
