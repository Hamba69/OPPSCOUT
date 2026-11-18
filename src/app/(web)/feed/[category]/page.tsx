import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CategoryMatches } from "@/components/category-matches";
import { requirePageAuth } from "@/lib/auth";
import { loadFeedItems } from "@/lib/feed-items";
import { getUserProfile } from "@/lib/profile-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Matches" };

type Props = { params: Promise<{ category: string }> };

/** One category of the seeker's matches (or every match at /feed/all), opened from the home tiles. */
export default async function CategoryMatchesPage({ params }: Props): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization", "admin"]);
  if (auth.role === "admin") redirect("/admin/kpis");
  const { category } = await params;
  const { userId } = auth;
  const profile = await getUserProfile(userId);
  if (!profile) redirect("/profile");

  const items = await loadFeedItems(userId, profile);
  if (!items.length) redirect("/feed");
  return (
    <main className="animate-in flex flex-col gap-6">
      <CategoryMatches key={category} items={items} category={decodeURIComponent(category).trim().toLowerCase()} />
    </main>
  );
}
