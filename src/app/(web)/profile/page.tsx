import { ProfileForm, type ProfileFormInitial } from "@/components/profile-form";
import { requirePageAuth } from "@/lib/auth";
import { getProfileChoices } from "@/lib/profile-options";
import { getUserProfile } from "@/lib/profile-store";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ next?: string }> }): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const { next } = await searchParams;
  const [profile, choices] = await Promise.all([getUserProfile(userId), getProfileChoices()]);
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/feed";
  const experience = (items: { title: string; organization?: string; months: number }[] | undefined): { title: string; organization: string; months: number }[] =>
    (items ?? []).map((item) => ({ title: item.title, organization: item.organization ?? "", months: item.months }));
  const initial: ProfileFormInitial = {
    name: profile?.name ?? "", email: profile?.email ?? "", phone: profile?.phone ?? "", dateOfBirth: profile?.dateOfBirth?.toISOString().slice(0, 10) ?? "", location: profile?.location ?? "",
    educationLevel: profile?.educationLevel ?? "", institution: profile?.institution ?? "", fieldOfStudy: profile?.fieldOfStudy ?? "", graduationStatus: profile?.graduationStatus ?? "",
    skills: profile?.skills ?? [], certifications: profile?.certifications ?? [], languages: profile?.languages ?? [],
    workExperience: experience(profile?.workExperience), internshipExperience: experience(profile?.internshipExperience),
    opportunityCategories: profile?.opportunityCategories ?? [], careerInterests: profile?.careerInterests ?? [], preferredLocations: profile?.preferredLocations ?? [],
    workModePreference: profile?.workModePreference ?? "",
  };
  const score = profile?.profileCompletenessScore ?? 0;
  return <main className="page-shell animate-in">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-extrabold text-ink sm:text-4xl">Your profile</h1><p className="mt-1 max-w-xl text-navy">A complete profile gives you more accurate matches. Fields marked * are required.</p></div>
      <div className="w-full max-w-[14rem]"><p className="text-sm font-bold text-ink">{score}% complete</p><div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness"><div className="h-full rounded-full bg-leaf" style={{ width: `${score}%` }} /></div></div>
    </div>
    <ProfileForm initial={initial} choices={choices} isNew={!profile} nextPath={nextPath} />
  </main>;
}
