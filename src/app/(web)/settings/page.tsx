import type { Metadata } from "next";
import Link from "next/link";

import { SettingsForm } from "@/components/settings-form";
import { ProfileArea } from "@/components/profile-area";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account" };

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization", "admin"]);
  const { userId } = auth;
  const profile = await (await getRepository()).getProfile(userId);
  return <main className="page-shell animate-in">
    <ProfileArea active="account">
      <h1 className="text-2xl font-extrabold text-ink sm:text-4xl">Account</h1>
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
      <h2 className="mt-8 text-lg font-extrabold text-ink">Notifications</h2>
      <p className="mt-1 text-sm text-navy">Choose how and when we notify you about new matches and closing dates.</p>
      <SettingsForm channel={profile?.preferredChannel ?? "email"} secondaryChannels={profile?.secondaryChannels ?? []} frequency={profile?.notificationFrequency ?? "instant"} enabled={profile?.notificationsEnabled ?? true} />
    </ProfileArea>
  </main>;
}
