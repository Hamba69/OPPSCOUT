import { EmptyState } from "@/components/empty-state";
import { demoSourceHref } from "@/data/demo-catalog";
import { MatchCard } from "@/components/match-card";
import { requirePageAuth } from "@/lib/auth";
import { getRepository, isMemoryDataMode } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";

export const dynamic = "force-dynamic";

export default async function FeedPage(): Promise<React.JSX.Element> {
  const repository = await getRepository();
  const { userId } = await requirePageAuth(["user"]);
  const profile = await repository.getProfile(userId);
  const matches = await buildRankedFeed(repository, userId);
  const now = new Date();
  return (
    <main className="page-shell animate-in">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Fresh picks for {profile?.name ?? "you"}</p><h1 className="mt-2 text-4xl font-black">Matches worth your time.</h1><p className="mt-2 text-ink/60">Eligibility checked. Sources verified. Reasons included.</p></div><span className="pill">{matches.length} clear matches</span></div>
      {isMemoryDataMode() && <p className="mt-5 text-sm text-ink/55">Demo collection · Fictional listings and organizations. Dates are relative to this demo session.</p>}
      {matches.length ? <div className="mt-8 grid gap-5 md:grid-cols-2">{matches.map((match) => {
        const opportunity = match.opportunity!;
        return <MatchCard daysLeft={Math.ceil((opportunity.deadline.getTime() - now.getTime()) / 86_400_000)} key={match.id} id={match.id} opportunityId={opportunity.id} title={opportunity.title} organization={opportunity.organization?.name ?? "Verified organization"} score={match.score} deadline={opportunity.deadline.toISOString()} location={opportunity.location} workMode={opportunity.workMode} matched={match.matchedFactors} missing={match.missingFactors} sourceUrl={isMemoryDataMode() ? demoSourceHref(opportunity.sourceUrl) : opportunity.sourceUrl} checkedAt={opportunity.checkedAt.toISOString()} publicationDate={opportunity.publicationDate.toISOString()} />;
      })}</div> : <div className="mt-8"><EmptyState symbol="🌱" title="No clear matches yet" description="Add your study field, a few skills, and the places you would like to work. A little more about you helps us find a clearer fit." href="/profile" action="Complete your profile" /></div>}
    </main>
  );
}
