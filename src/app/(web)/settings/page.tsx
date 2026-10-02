import type { Metadata } from "next";
import Link from "next/link";

import { SettingsForm } from "@/components/settings-form";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const profile = await (await getRepository()).getProfile(userId);
  return <main className="page-shell animate-in mx-auto max-w-3xl">
    <h1 className="text-2xl font-extrabold text-ink sm:text-4xl">Settings</h1>
    <section className="card mt-6" aria-labelledby="account-settings">
      <h2 id="account-settings" className="text-lg font-extrabold text-ink">Account</h2>
      <p className="mt-1 text-sm text-navy">{profile?.email ? `Signed in as ${profile.email}.` : "Manage your details and session."}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/profile" className="button-secondary">Edit my profile</Link>
        <form action="/auth/logout" method="post"><button className="button-secondary">Sign out</button></form>
      </div>
    </section>
    <h2 className="mt-8 text-lg font-extrabold text-ink">Notifications</h2>
    <p className="mt-1 text-sm text-navy">Choose how and when we notify you about new matches and closing dates.</p>
    <SettingsForm channel={profile?.preferredChannel ?? "email"} secondaryChannels={profile?.secondaryChannels ?? []} frequency={profile?.notificationFrequency ?? "instant"} enabled={profile?.notificationsEnabled ?? true} />
  </main>;
}
