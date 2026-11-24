import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CategoryMatches } from "@/components/category-matches";
import { EmptyState } from "@/components/empty-state";
import { requirePageAuth } from "@/lib/auth";
import { loadMatchesWithTips } from "@/lib/feed-items";
import { MatchTips } from "@/components/match-tips";
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

  const { items, tips } = await loadMatchesWithTips(userId, profile);
  if (!items.length) {
    return <main className="animate-in flex flex-col gap-6">
      <header className="title-card"><h1>Today&apos;s matches</h1></header>
      {isProfileCompleteForMatching(profile)
        ? tips.length
          ? <MatchTips tips={tips} hasMatches={false} />
          : <EmptyState title="No matches available right now" description="Nothing fits your profile today. New opportunities are added often, and we'll let you know when one fits." href="/opportunities" action="Browse all opportunities" />
        : <EmptyState title="We need a few more details" description="Add your education, field of study, skills and the opportunity types you want so we can find relevant matches." href="/profile" action="Complete your profile" />}
    </main>;
  }
  return (
    <main className="animate-in flex flex-col gap-6">
      <CategoryMatches items={items} category={decodeURIComponent(category).trim().toLowerCase()} />
      {/* Only a few matches: a short card underneath, never above them. */}
      <MatchTips tips={tips} hasMatches />
    </main>
  );
}
