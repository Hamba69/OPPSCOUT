import { ProfileForm, type ProfileFormInitial } from "@/components/profile-form";
import { ProfileArea } from "@/components/profile-area";
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
    githubUrl: profile?.githubUrl ?? "", portfolioUrl: profile?.portfolioUrl ?? "",
    otherLinks: profile?.otherLinks ?? [], projects: (profile?.projects ?? []).map((item) => ({ ...item, url: item.url ?? "", role: item.role ?? "" })),
    shareWithOrganizations: profile?.shareWithOrganizations ?? false, shareContactDetails: profile?.shareContactDetails ?? false,
  };
  return <main className="page-shell animate-in">
    <ProfileArea active="profile">
      <h1 className="text-2xl font-extrabold text-ink sm:text-4xl">Edit profile</h1>
      <ProfileForm initial={initial} choices={choices} isNew={!profile} nextPath={nextPath} />
    </ProfileArea>
  </main>;
}
