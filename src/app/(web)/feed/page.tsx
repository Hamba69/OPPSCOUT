import { EmptyState } from "@/components/empty-state";
import { FeedBrowser, type FeedItem } from "@/components/feed-browser";
import { requirePageAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile-store";
import { getRepository } from "@/lib/repository";
import { isProfileCompleteForMatching } from "@/services/profile/completeness";
import { buildRankedFeed } from "@/services/matching/feed";
import { redirect } from "next/navigation";
import { choiceLabel } from "@/services/profile/choices";

export const dynamic = "force-dynamic";

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ type?: string }> }): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization", "admin"]);
  if (auth.role === "admin") redirect("/admin/kpis");
  const { type = "" } = await searchParams;
  const { userId } = auth;
  const [profile, repository] = await Promise.all([getUserProfile(userId), getRepository()]);
  if (!profile) redirect("/profile");

  const matches = await buildRankedFeed(repository, userId, new Date(), undefined, { persist: false, profile });
  const now = new Date();
  const items: FeedItem[] = matches.map((match) => {
    const opportunity = match.opportunity!;
    const daysLeft = opportunity.deadline ? Math.ceil((opportunity.deadline.getTime() - now.getTime()) / 86_400_000) : null;
    return { daysLeft, id: match.id, opportunityId: opportunity.id, category: opportunity.category, categoryLabel: choiceLabel(opportunity.category), title: opportunity.title, organization: opportunity.organization?.name ?? opportunity.organizationName ?? "Source organization", origin: opportunity.origin ?? "catalog", score: match.score, deadline: opportunity.deadline?.toISOString() ?? null, location: opportunity.location, workMode: opportunity.workMode === "unknown" ? "" : opportunity.workMode, sourceUrl: opportunity.sourceUrl, checkedAt: opportunity.checkedAt.toISOString(), publicationDate: opportunity.publicationDate.toISOString() };
  });
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Kampala" }).format(now));
  const salutation = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile.name?.trim().split(/\s+/)[0] || undefined;
  return (
    <main className="animate-in flex flex-col gap-6">
      {matches.length ? <FeedBrowser key={type.trim().toLowerCase()} items={items} salutation={salutation} firstName={firstName} initialType={type} /> : <>
        <section className="greeting">
          <div className="orb orb-lg" aria-hidden="true" />
          <h1>{salutation}{firstName ? <> <strong>{firstName}</strong></> : null}, let&apos;s find what fits you.</h1>
        </section>
        {isProfileCompleteForMatching(profile)
          ? <EmptyState title="No matches available right now" description="There are no opportunities that fit your profile at the moment. We will notify you as soon as one becomes available." href="/opportunities" action="Browse all opportunities" />
          : <EmptyState title="We need a few more details" description="Add your education, field of study, skills and the opportunity types you want so we can find relevant matches." href="/profile" action="Complete your profile" />}
      </>}
    </main>
  );
    
}
