import { ProfileForm } from "@/components/profile-form";
import { requirePageAuth } from "@/lib/auth";
import { isMatchingProfileReady } from "@/lib/page-access";
import { getUserProfile } from "@/lib/profile-store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ProfilePageProps { searchParams: Promise<{ next?: string }> }

function profileNextPath(requested?: string): string {
  if (!requested || !requested.startsWith("/") || requested.startsWith("//") || requested.includes("\\")) return "/feed";
  if (["/feed", "/saved", "/settings"].includes(requested)) return requested;
  if (requested.startsWith("/settings?section=") || requested.startsWith("/opportunity/")) return requested;
  return "/feed";
}

export default async function ProfilePage({ searchParams }: ProfilePageProps): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const profile = await getUserProfile(userId);
  if (profile && isMatchingProfileReady(profile)) redirect("/settings?section=profile");
  const { next } = await searchParams;
  const afterSavePath = profileNextPath(next);
  const initial = {
    name: profile?.name ?? "", email: profile?.email ?? "", phone: profile?.phone ?? "", educationLevel: profile?.educationLevel ?? "",
    fieldOfStudy: profile?.fieldOfStudy ?? "", graduationStatus: profile?.graduationStatus ?? "", dateOfBirth: profile?.dateOfBirth?.toISOString().slice(0, 10) ?? "", location: profile?.location ?? "",
    skills: profile?.skills.join(", ") ?? "", careerInterests: profile?.careerInterests.join(", ") ?? "", preferredLocations: profile?.preferredLocations.join(", ") ?? "",
    opportunityCategories: profile?.opportunityCategories.join(", ") ?? "", languages: profile?.languages.join(", ") ?? "", workModePreference: profile?.workModePreference ?? "" as const,
  };
  return <main className="page-shell animate-in">
    <p className="eyebrow">Step 2 of 2 · Your profile</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-4xl font-black">Tell us the useful bits.</h1>
        <p className="mt-2 text-ink/60">Only your name is needed to continue. Add what you know now; you can update the rest anytime.</p>
      </div>
      <span className="pill">{profile ? `${profile.profileCompletenessScore}% complete` : "Your profile stays private"}</span>
    </div>
    <section className="card mt-6 border-l-4 border-sun">
      <h2 className="font-black">How matching works</h2>
      <p className="mt-2 text-sm leading-6 text-ink/70">Your skills, interests, locations, and work preferences help rank matches; they are not a checklist. Education, age, language, and programme rules can affect eligibility when a listing explicitly requires them. Add accurate details where you can, and leave anything you do not know blank.</p>
      <p className="mt-2 text-sm leading-6 text-ink/70">The feed shows only open, verified opportunities that meet the eligibility details in your profile. If there are no matches, it may be because no current listings pass review or fit the details provided—not because your profile is incomplete.</p>
    </section>
    <ProfileForm initial={initial} afterSavePath={afterSavePath} />
  </main>;
}
