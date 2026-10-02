import { EmptyState } from "@/components/empty-state";
import { FeedBrowser, type FeedItem } from "@/components/feed-browser";
import { requirePageAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile-store";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FeedPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization", "admin"]);
  if (auth.role === "organization") redirect("/dashboard");
  if (auth.role === "admin") redirect("/admin/kpis");
  const { userId } = auth;
  const profile = await getUserProfile(userId);
  if (!profile) redirect("/profile");

  const repository = await getRepository();
  const matches = await buildRankedFeed(repository, userId, new Date(), undefined, { persist: false });
  const now = new Date();
  const items: FeedItem[] = matches.map((match) => {
    const opportunity = match.opportunity!;
    const daysLeft = opportunity.deadline ? Math.ceil((opportunity.deadline.getTime() - now.getTime()) / 86_400_000) : null;
    return { daysLeft, id: match.id, opportunityId: opportunity.id, category: opportunity.category, title: opportunity.title, organization: opportunity.organization?.name ?? "Verified organization", score: match.score, deadline: opportunity.deadline?.toISOString() ?? null, location: opportunity.location, workMode: opportunity.workMode, matched: match.matchedFactors, missing: match.missingFactors, sourceUrl: opportunity.sourceUrl, checkedAt: opportunity.checkedAt.toISOString(), publicationDate: opportunity.publicationDate.toISOString() };
  });
  return (
    <main className="page-shell animate-in">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{matches.length} {matches.length === 1 ? "match" : "matches"} for you</h1>
      <p className="mt-1 text-sm text-navy">Best fit first. Every listing is verified.</p>
      {matches.length ? <FeedBrowser items={items} /> : <div className="mt-6"><EmptyState title="No clear matches yet" description="Add your study field, a few skills, and the places you would like to work. A little more about you helps us find a clearer fit." href="/profile" action="Complete your profile" /></div>}
    </main>
  );
}
