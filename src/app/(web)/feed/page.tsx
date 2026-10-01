import { EmptyState } from "@/components/empty-state";
import { FeedBrowser, type FeedItem } from "@/components/feed-browser";
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
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Kampala" }).format(now)) % 24;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const items: FeedItem[] = matches.map((match) => {
    const opportunity = match.opportunity!;
    const daysLeft = opportunity.deadline ? Math.ceil((opportunity.deadline.getTime() - now.getTime()) / 86_400_000) : null;
    return { daysLeft, id: match.id, opportunityId: opportunity.id, category: opportunity.category, title: opportunity.title, organization: opportunity.organization?.name ?? "Verified organization", score: match.score, deadline: opportunity.deadline?.toISOString() ?? null, location: opportunity.location, workMode: opportunity.workMode, matched: match.matchedFactors, missing: match.missingFactors, sourceUrl: opportunity.sourceUrl, checkedAt: opportunity.checkedAt.toISOString(), publicationDate: opportunity.publicationDate.toISOString() };
  });
  return (
    <main className="page-shell animate-in">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">{greeting}, {profile?.name ?? "there"}</p><h1 className="mt-1 text-3xl font-extrabold text-ink sm:text-4xl">Matches worth your time.</h1><p className="mt-2 text-navy">Eligibility checked. Sources verified. Reasons included.</p></div><span className="pill">{matches.length} {matches.length === 1 ? "match" : "matches"}</span></div>
      {matches.length ? <FeedBrowser items={items} /> : <div className="mt-8"><EmptyState title="No clear matches yet" description="Add your study field, a few skills, and the places you would like to work. A little more about you helps us find a clearer fit." href="/profile" action="Complete your profile" /></div>}
    </main>
  );
}
