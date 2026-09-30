import { EmptyState } from "@/components/empty-state";
import { MatchCard } from "@/components/match-card";
import { requireSeekerProfile } from "@/lib/page-access";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";

export const dynamic = "force-dynamic";

export default async function FeedPage(): Promise<React.JSX.Element> {
  const { userId, profile } = await requireSeekerProfile("/feed");

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
      })}</div> : <div className="mt-8"><EmptyState symbol="🌱" title="No eligible matches right now" description="Your feed includes only open, verified listings that meet their stated eligibility requirements. Skills and interests improve ranking but do not override eligibility. Check that your education, location, and other details are accurate, and check back as more listings are verified." href="/settings?section=profile" action="Review my profile" /></div>}
    </main>
  );
}
