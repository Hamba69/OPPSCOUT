import { EmptyState } from "@/components/empty-state";
import { FeedBrowser, type FeedItem } from "@/components/feed-browser";
import { requirePageAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile-store";
import { getRepository } from "@/lib/repository";
import { isProfileCompleteForMatching } from "@/services/profile/completeness";
import { buildRankedFeed } from "@/services/matching/feed";
import Link from "next/link";
import { redirect } from "next/navigation";
import { choiceLabel } from "@/services/profile/choices";

export const dynamic = "force-dynamic";

export default async function FeedPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization", "admin"]);
  if (auth.role === "organization") redirect("/dashboard");
  if (auth.role === "admin") redirect("/admin/kpis");
  const { userId } = auth;
  const [profile, repository] = await Promise.all([getUserProfile(userId), getRepository()]);
  if (!profile) redirect("/profile");

  const matches = await buildRankedFeed(repository, userId, new Date(), undefined, { persist: false, profile });
  const now = new Date();
  const items: FeedItem[] = matches.map((match) => {
    const opportunity = match.opportunity!;
    const daysLeft = opportunity.deadline ? Math.ceil((opportunity.deadline.getTime() - now.getTime()) / 86_400_000) : null;
    return { daysLeft, id: match.id, opportunityId: opportunity.id, category: opportunity.category, categoryLabel: choiceLabel(opportunity.category), title: opportunity.title, organization: opportunity.organization?.name ?? opportunity.organizationName ?? "Source organization", origin: opportunity.origin ?? "catalog", score: match.score, deadline: opportunity.deadline?.toISOString() ?? null, location: opportunity.location, workMode: opportunity.workMode === "unknown" ? "Work mode not stated" : opportunity.workMode, matched: match.matchedFactors, missing: match.missingFactors, sourceUrl: opportunity.sourceUrl, checkedAt: opportunity.checkedAt.toISOString(), publicationDate: opportunity.publicationDate.toISOString() };
  });
  return (
    <main className="page-shell animate-in sm:!py-10">
      <div className="page-header">
        <div>
          <h1>Your matches</h1>
          <p>Opportunities that fit your profile.</p>
        </div>
        <Link href="/profile" className="button-secondary !min-h-11 !px-5">Edit profile</Link>
      </div>
      {matches.length ? <FeedBrowser items={items} /> : <div>{isProfileCompleteForMatching(profile)
        ? <EmptyState title="No matches available right now" description="There are no opportunities that fit your profile at the moment. We will notify you as soon as one becomes available." href="/opportunities" action="Browse all opportunities" />
        : <EmptyState title="We need a few more details" description="Add your education, field of study, skills and the opportunity types you want so we can find relevant matches." href="/profile" action="Complete your profile" />}</div>}
    </main>
  );    
}
