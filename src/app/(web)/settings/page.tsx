import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/app-shell";
import { SettingsForm } from "@/components/settings-form";
import { AccountDataActions } from "@/components/account-data-actions";
import { ProfileArea } from "@/components/profile-area";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account" };

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization", "admin"]);
  const { userId } = auth;
  const profile = await (await getRepository()).getProfile(userId);
  return <main className="animate-in flex flex-col gap-6">
    <ProfileArea active="account" title="Settings">
      <div className="grid gap-4 md:grid-cols-2">
        <section className="surface" aria-labelledby="account-settings">
          <h2 id="account-settings" className="surface-title">Account</h2>
          <p className="mt-3 text-sm font-semibold text-ink">{profile?.email ?? "Your signed-in account"}</p>
          <p className="mt-1 text-[13px] text-navy">Signed in with email and password</p>
          <form action="/auth/logout" method="post" className="mt-4"><button className="button-secondary"><Icon name="signOut" size={15} strokeWidth={2.2} />Sign out</button></form>
        </section>
        <section className="surface" aria-labelledby="security-settings">
          <h2 id="security-settings" className="surface-title">Sign-in and security</h2>
          <p className="mt-3 text-[13px] leading-6 text-navy">Use a strong password you don&apos;t use anywhere else.</p>
          <Link href="/reset-password?returnTo=%2Fsettings" className="button-secondary mt-4">Change password</Link>
        </section>
      </div>
      <section aria-labelledby="notification-settings">
        <h2 id="notification-settings" className="section-title">Notifications</h2>
        <p className="mt-1 text-[13px] text-navy">Choose how and when we notify you about new matches and closing dates.</p>
        <SettingsForm channel={profile?.preferredChannel ?? "email"} secondaryChannels={profile?.secondaryChannels ?? []} frequency={profile?.notificationFrequency ?? "instant"} enabled={profile?.notificationsEnabled ?? true} />
      </section>
      <section className="surface" aria-labelledby="your-data">
        <h2 id="your-data" className="surface-title">Your data</h2>
        <div className="mt-3"><AccountDataActions /></div>
        <p className="mt-4 text-xs text-navy">How we use your data: <Link className="underline" href="/privacy">Privacy Policy</Link> · <Link className="underline" href="/terms">Terms of Use</Link></p>
      </section>
      <section className="surface" aria-labelledby="share-opportunities">
        <h2 id="share-opportunities" className="surface-title">Share opportunities</h2>
        <p className="mt-3 text-[13px] leading-6 text-navy">Anyone can post an opportunity. Our team reviews every post before it goes live.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/post" className="button-secondary"><Icon name="plus" size={15} strokeWidth={2.2} />Post an opportunity</Link>
          <Link href="/my-postings" className="button-secondary">My postings</Link>
        </div>
      </section>
    </ProfileArea>
  </main>;
}
