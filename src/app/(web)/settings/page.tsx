import Link from "next/link";

import { ProfileForm, type ProfileFormInitial } from "@/components/profile-form";
import { SettingsForm } from "@/components/settings-form";
import { requireSeekerProfile } from "@/lib/page-access";
import { createClient } from "@/lib/supabase/server";
import { getProfileChoices } from "@/lib/profile-options";

export const dynamic = "force-dynamic";

type SettingsSection = "profile" | "notifications" | "account";
interface SettingsPageProps { searchParams: Promise<{ section?: string }> }

const sections: ReadonlyArray<readonly [SettingsSection, string]> = [
  ["profile", "Profile"],
  ["notifications", "Notifications"],
  ["account", "Account"],
];

export default async function SettingsPage({ searchParams }: SettingsPageProps): Promise<React.JSX.Element> {
  const { profile } = await requireSeekerProfile("/settings");
  const { section: requestedSection } = await searchParams;
  const section: SettingsSection = sections.some(([key]) => key === requestedSection)
    ? requestedSection as SettingsSection
    : "profile";
  const { data: { user } } = await (await createClient()).auth.getUser();
  const workModePreference = profile.workModePreference;
  const normalizedWorkMode: ProfileFormInitial["workModePreference"] = workModePreference === "remote" || workModePreference === "onsite" || workModePreference === "hybrid"
    ? workModePreference
    : "";
  const initial = {
    name: profile.name,
    email: profile.email ?? user?.email ?? "",
    phone: profile.phone ?? "",
    educationLevel: profile.educationLevel ?? "",
    fieldOfStudy: profile.fieldOfStudy ?? "",
    graduationStatus: profile.graduationStatus ?? "",
    dateOfBirth: profile.dateOfBirth?.toISOString().slice(0, 10) ?? "",
    location: profile.location ?? "",
    skills: profile.skills,
    careerInterests: profile.careerInterests,
    preferredLocations: profile.preferredLocations,
    opportunityCategories: profile.opportunityCategories,
    languages: profile.languages,
    workModePreference: normalizedWorkMode,
  };

  const profileChoices = section === "profile" ? await getProfileChoices() : undefined;
  return (
    <main className="page-shell animate-in">
      <p className="eyebrow">Your space, your choices</p>
      <h1 className="mt-2 text-4xl font-black">Settings</h1>
      <p className="mt-2 max-w-2xl text-ink/60">Keep your opportunity profile, alerts, and account details together in one place.</p>
      <nav aria-label="Settings sections" className="nav-capsule mt-6 w-fit max-w-full flex-wrap">
        {sections.map(([key, label]) => (
          <Link key={key} href={`/settings?section=${key}`} aria-current={section === key ? "page" : undefined}
            className={`min-h-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${section === key ? "active" : ""}`}>
            {label}
          </Link>
        ))}
      </nav>

      {section === "profile" && <section className="mt-6">
        <h2 className="text-xl font-black">Your matching profile</h2>
        <p className="mt-1 text-sm text-ink/60">These details shape your matches and stay private to your account.</p>
        <ProfileForm initial={initial} choices={profileChoices} />
      </section>}

      {section === "notifications" && <section className="mt-6">
        <h2 className="text-xl font-black">Opportunity alerts</h2>
        <p className="mt-1 text-sm text-ink/60">Choose where and how often OppScout should send updates.</p>
        <SettingsForm channel={profile.preferredChannel ?? "email"} secondaryChannels={profile.secondaryChannels ?? []}
          frequency={profile.notificationFrequency ?? "instant"} enabled={profile.notificationsEnabled ?? true} />
      </section>}

      {section === "account" && <section className="card mt-6 max-w-xl">
        <p className="eyebrow">Sign-in account</p>
        <h2 className="mt-2 text-xl font-black">Your account</h2>
        <p className="mt-2 text-sm text-ink/60">You are signed in with this email address.</p>
        <p className="mt-4 rounded-2xl bg-butter p-4 font-bold">{user?.email ?? "Email unavailable"}</p>
        <form action="/auth/logout" method="post" className="mt-5">
          <button className="button-secondary w-full">Sign out</button>
        </form>
      </section>}
    </main>
  );
}
