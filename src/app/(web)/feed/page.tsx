import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ClosingSoon, NewToday, ProfileStrength, TodayCard } from "@/components/home-briefing";
import { requirePageAuth } from "@/lib/auth";
import { APP_TIME_ZONE } from "@/lib/dates";
import { loadMatchClosing, loadNewToday, loadSavedClosing } from "@/lib/home-briefing";
import { getUserProfile } from "@/lib/profile-store";
import type { UserProfile } from "@/core/entities/domain";
import { isProfileCompleteForMatching } from "@/services/profile/completeness";
import { profileNudge } from "@/services/profile/nudge";

export const dynamic = "force-dynamic";

/** With nothing saved closing soon, falls back to the seeker's matches. Streams in, because it runs matching. */
async function MatchClosing({ userId, profile, now }: { userId: string; profile: UserProfile; now: Date }): Promise<React.JSX.Element | null> {
  return <ClosingSoon items={await loadMatchClosing(userId, profile, now)} fromSaved={false} />;
}

/**
 * Matches home: a daily briefing. The first card carries the date, the greeting and "View today's matches",
 * which opens /feed/all. The sections below each appear only when they have something to show.
 */
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
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: APP_TIME_ZONE }).format(now));
  const salutation = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateLine = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: APP_TIME_ZONE }).format(now);
  const firstName = profile.name?.trim().split(/\s+/)[0] || undefined;
  const ready = isProfileCompleteForMatching(profile);

  const [savedClosing, newTiles] = await Promise.all([loadSavedClosing(userId, now), loadNewToday(now)]);

  return (
    <main className="animate-in flex flex-col gap-7">
      <TodayCard dateLine={dateLine} salutation={salutation} firstName={firstName} ready={ready} />
      {savedClosing.length
        ? <ClosingSoon items={savedClosing} fromSaved />
        : ready && <Suspense fallback={null}><MatchClosing userId={userId} profile={profile} now={now} /></Suspense>}
      <NewToday tiles={newTiles} />
      <ProfileStrength nudge={profileNudge(profile)} />
    </main>
  );
}
