import { AdminPortalTrigger } from "@/components/admin-portal-trigger";
import type { Metadata } from "next";
import Link from "next/link";

import { SettingsForm } from "@/components/settings-form";
import { ProfileArea } from "@/components/profile-area";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ unlock?: string | string[] }> }): Promise<React.JSX.Element> {
  const { unlock } = await searchParams;
  const auth = await requirePageAuth(["user", "organization", "admin"]);
  const { userId } = auth;
  const profile = await (await getRepository()).getProfile(userId);
  const accessDb = (await import("@/lib/supabase/admin")).createServiceRoleClient();
  const accessResult = await accessDb.from("SeekerAccessLog").select("createdAt,action,organizationId").eq("seekerId", userId).order("createdAt", { ascending: false }).limit(50);
  const accessLogs = accessResult.data;
  return <main className="page-shell animate-in">
    <ProfileArea active="account">
      <div className="relative pr-12 lg:pr-0"><h1 className="text-2xl font-extrabold text-ink sm:text-4xl">Account</h1><AdminPortalTrigger initiallyOpen={unlock === "1"} /></div>
      <section className="card mt-6" aria-labelledby="account-settings">
        <h2 id="account-settings" className="text-lg font-extrabold text-ink">Sign-in and security</h2>
        <p className="mt-1 text-sm text-navy">{profile?.email ? `Signed in as ${profile.email}.` : "Manage your password and signed-in account."}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/reset-password?returnTo=%2Fsettings" className="button-secondary">Change password</Link>
          <form action="/auth/logout" method="post"><button className="button-secondary">Sign out</button></form>
          <form action="/auth/logout" method="post"><button className="button-secondary">Add another account</button></form>
        </div>
        <p className="mt-3 text-sm text-navy">Adding another account signs you out first, then lets you sign in or create a different account.</p>
      </section>
      {auth.role === "user" && <section className="card mt-6"><h2 className="text-lg font-extrabold text-ink">Who has viewed your profile</h2><div className="mt-3 space-y-2">{(accessLogs ?? []).map((log) => <p className="text-sm text-navy" key={`${log.createdAt}-${log.organizationId}-${log.action}`}>Organization {log.organizationId} {log.action === "download_document" ? "downloaded a paper" : "viewed your profile"} · {new Date(log.createdAt).toLocaleDateString()}</p>)}{!accessLogs?.length && <p className="text-sm text-navy">No organization views yet.</p>}</div></section>}
      <h2 className="mt-8 text-lg font-extrabold text-ink">Notifications</h2>
      <p className="mt-1 text-sm text-navy">Choose how and when we notify you about new matches and closing dates.</p>
      <SettingsForm channel={profile?.preferredChannel ?? "email"} secondaryChannels={profile?.secondaryChannels ?? []} frequency={profile?.notificationFrequency ?? "instant"} enabled={profile?.notificationsEnabled ?? true} />
    </ProfileArea>
  </main>;
}
