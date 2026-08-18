import { ProfileForm } from "@/components/profile-form";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ProfilePage(): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const profile = await (await getRepository()).getProfile(userId);
  const initial = {
    name: profile?.name ?? "", email: profile?.email ?? "", phone: profile?.phone ?? "", educationLevel: profile?.educationLevel ?? "",
    fieldOfStudy: profile?.fieldOfStudy ?? "", graduationStatus: profile?.graduationStatus ?? "", dateOfBirth: profile?.dateOfBirth?.toISOString().slice(0, 10) ?? "", location: profile?.location ?? "",
    skills: profile?.skills.join(", ") ?? "", careerInterests: profile?.careerInterests.join(", ") ?? "", preferredLocations: profile?.preferredLocations.join(", ") ?? "",
    opportunityCategories: profile?.opportunityCategories.join(", ") ?? "", languages: profile?.languages.join(", ") ?? "", workModePreference: profile?.workModePreference ?? "" as const,
  };
  return <main className="page-shell"><p className="eyebrow">A profile that works for you</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-4xl font-black">Tell us the useful bits.</h1><p className="mt-2 text-ink/60">Keep it simple. You can update this anytime.</p></div><span className="pill">{profile?.profileCompletenessScore ?? 0}% complete</span></div><ProfileForm initial={initial} /></main>;
}
