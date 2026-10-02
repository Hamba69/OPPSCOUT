import { ProfileForm } from "@/components/profile-form";
import { requirePageAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile-store";

export const dynamic = "force-dynamic";

export default async function ProfilePage(): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const profile = await getUserProfile(userId);
  const initial = {
    name: profile?.name ?? "", email: profile?.email ?? "", phone: profile?.phone ?? "", educationLevel: profile?.educationLevel ?? "",
    fieldOfStudy: profile?.fieldOfStudy ?? "", graduationStatus: profile?.graduationStatus ?? "", dateOfBirth: profile?.dateOfBirth?.toISOString().slice(0, 10) ?? "", location: profile?.location ?? "",
    skills: profile?.skills ?? [], careerInterests: profile?.careerInterests ?? [], preferredLocations: profile?.preferredLocations ?? [],
    opportunityCategories: profile?.opportunityCategories ?? [], languages: profile?.languages ?? [], workModePreference: profile?.workModePreference ?? "" as const,
    certifications: profile?.certifications ?? [], workExperience: profile?.workExperience ?? [], internshipExperience: profile?.internshipExperience ?? [],
  };
  return <main className="page-shell animate-in"><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Tell us the useful bits.</h1><p className="mt-2 text-navy">Keep it simple. You can update this anytime.</p></div><div className="w-full max-w-[14rem]"><p className="text-sm font-bold text-ink">{profile?.profileCompletenessScore ?? 0}% complete</p><div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={profile?.profileCompletenessScore ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness"><div className="h-full rounded-full bg-leaf" style={{ width: `${profile?.profileCompletenessScore ?? 0}%` }} /></div></div></div><ProfileForm initial={initial} /></main>;
}
