import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CategoryMatches } from "@/components/category-matches";
import { EmptyState } from "@/components/empty-state";
import { requirePageAuth } from "@/lib/auth";
import { loadFeedItems } from "@/lib/feed-items";
import { getUserProfile } from "@/lib/profile-store";
import { isProfileCompleteForMatching } from "@/services/profile/completeness";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Matches" };

type Props = { params: Promise<{ category: string }> };

/** Today's matches (/feed/all, opened from the home page) or one category of them. Matching runs on each load. */
export default async function CategoryMatchesPage({ params }: Props): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization", "admin"]);
  if (auth.role === "admin") redirect("/admin/kpis");
  const { category } = await params;
  const { userId } = auth;
  const profile = await getUserProfile(userId);
  if (!profile) redirect("/profile");

  const items = await loadFeedItems(userId, profile);
  if (!items.length) {
    return <main className="animate-in flex flex-col gap-6">
      <header className="title-card"><h1>Today&apos;s matches</h1></header>
      {isProfileCompleteForMatching(profile)
        ? <EmptyState title="No matches available right now" description="There are no opportunities that fit your profile at the moment. We will notify you as soon as one becomes available." href="/opportunities" action="Browse all opportunities" />
        : <EmptyState title="We need a few more details" description="Add your education, field of study, skills and the opportunity types you want so we can find relevant matches." href="/profile" action="Complete your profile" />}
    </main>;
  }
  return (
    <main className="animate-in flex flex-col gap-6">
      <CategoryMatches items={items} category={decodeURIComponent(category).trim().toLowerCase()} />
    </main>
  );
}
