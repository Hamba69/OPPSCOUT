import { MatchCard } from "@/components/match-card";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";

export const dynamic = "force-dynamic";

export default async function FeedPage(): Promise<React.JSX.Element> {
  const repository = await getRepository();
  const { userId } = await requirePageAuth(["user"]);
  const profile = await repository.getProfile(userId);
  const matches = await buildRankedFeed(repository, userId);
  return (
    <main className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Fresh picks for {profile?.name ?? "you"}</p><h1 className="mt-2 text-4xl font-black">Matches worth your time.</h1><p className="mt-2 text-ink/60">Eligibility checked. Sources verified. Reasons included.</p></div><span className="pill">{matches.length} clear matches</span></div>
      {matches.length ? <div className="mt-8 grid gap-5 md:grid-cols-2">{matches.map((match) => {
        const opportunity = match.opportunity!;
        return <MatchCard key={match.id} id={match.id} opportunityId={opportunity.id} title={opportunity.title} organization={opportunity.organization?.name ?? "Verified organization"} score={match.score} deadline={opportunity.deadline.toISOString()} location={opportunity.location} workMode={opportunity.workMode} matched={match.matchedFactors} missing={match.missingFactors} sourceUrl={opportunity.sourceUrl} checkedAt={opportunity.checkedAt.toISOString()} />;
      })}</div> : <div className="card mt-8 bg-butter text-center"><div className="text-5xl">🌱</div><h2 className="mt-3 text-2xl font-black">No clear matches yet</h2><p className="mt-2">Add a little more to your profile and check back soon.</p></div>}
    </main>
  );
}
