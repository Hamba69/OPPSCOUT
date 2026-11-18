import { EmptyState } from "@/components/empty-state";
import { FeedBrowser } from "@/components/feed-browser";
import { requirePageAuth } from "@/lib/auth";
import { loadFeedItems } from "@/lib/feed-items";
import { getUserProfile } from "@/lib/profile-store";
import { isProfileCompleteForMatching } from "@/services/profile/completeness";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ type?: string }> }): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization", "admin"]);
  if (auth.role === "admin") redirect("/admin/kpis");
  // Category views live on their own page now; keep old /feed?type= links working.
  const { type = "" } = await searchParams;
  if (type.trim()) redirect(`/feed/${encodeURIComponent(type.trim().toLowerCase())}`);
  const { userId } = auth;
  const profile = await getUserProfile(userId);
  if (!profile) redirect("/profile");

  const now = new Date();
  const items = await loadFeedItems(userId, profile, now);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Kampala" }).format(now));
  const salutation = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile.name?.trim().split(/\s+/)[0] || undefined;
  return (
    <main className="animate-in flex flex-col gap-6">
      {items.length ? <FeedBrowser items={items} salutation={salutation} firstName={firstName} /> : <>
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
