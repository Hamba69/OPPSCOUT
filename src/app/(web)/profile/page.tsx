import type { Metadata } from "next";
import { ProfileForm, type ProfileFormInitial } from "@/components/profile-form";
import { ProfileArea } from "@/components/profile-area";
import { getPageUserBirthDate, requirePageAuth } from "@/lib/auth";
import { getProfileChoices } from "@/lib/profile-options";
import { getUserProfile } from "@/lib/profile-store";
import { canonicalPreferredLocation, canonicalUgandaLocation } from "@/data/uganda-locations";

export const metadata: Metadata = { title: "My profile" };

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ next?: string }> }): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user"]);
  const { next } = await searchParams;
  const [profile, choices, accountBirthDate] = await Promise.all([getUserProfile(userId), getProfileChoices(), getPageUserBirthDate()]);
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/feed";
  const experience = (items: { title: string; organization?: string; months: number }[] | undefined): { title: string; organization: string; months: number }[] =>
    (items ?? []).map((item) => ({ title: item.title, organization: item.organization ?? "", months: item.months }));
  // Older profiles may hold places outside Uganda or free text. Those are mapped to a district when
  // possible and otherwise left empty, so the seeker picks a Ugandan district on their next save.
  const initial: ProfileFormInitial = {
    name: profile?.name ?? "", email: profile?.email ?? "", phone: profile?.phone ?? "", dateOfBirth: profile?.dateOfBirth?.toISOString().slice(0, 10) ?? accountBirthDate ?? "", location: canonicalUgandaLocation(profile?.location) ?? "",
    educationLevel: profile?.educationLevel ?? "", institution: profile?.institution ?? "", fieldOfStudy: profile?.fieldOfStudy ?? "", graduationStatus: profile?.graduationStatus ?? "",
    skills: profile?.skills ?? [], certifications: profile?.certifications ?? [], languages: profile?.languages ?? [],
    workExperience: experience(profile?.workExperience), internshipExperience: experience(profile?.internshipExperience),
    opportunityCategories: profile?.opportunityCategories ?? [], careerInterests: profile?.careerInterests ?? [], preferredLocations: [...new Set((profile?.preferredLocations ?? []).map(canonicalPreferredLocation).filter((place): place is string => Boolean(place)))],
    workModePreference: profile?.workModePreference ?? "",
    githubUrl: profile?.githubUrl ?? "", portfolioUrl: profile?.portfolioUrl ?? "",
    otherLinks: profile?.otherLinks ?? [], projects: (profile?.projects ?? []).map((item) => ({ ...item, url: item.url ?? "", role: item.role ?? "" })),
    shareWithOrganizations: profile?.shareWithOrganizations ?? false, shareContactDetails: profile?.shareContactDetails ?? false,
  };
  return <main className="animate-in flex flex-col gap-6">
    <ProfileArea active="profile" title="My profile">
      <ProfileForm initial={initial} choices={choices} isNew={!profile} nextPath={nextPath} />
    </ProfileArea>
  </main>;
}
