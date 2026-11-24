import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConfirmAgeForm } from "@/components/confirm-age-form";
import { getOptionalAuth, getPageUserBirthDate } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile-store";

export const metadata: Metadata = { title: "Confirm your age" };

export const dynamic = "force-dynamic";

/** The one-time age check for accounts without a confirmed 18+ date of birth. See isConfirmedAdult. */
export default async function ConfirmAgePage({ searchParams }: { searchParams: Promise<{ next?: string }> }): Promise<React.JSX.Element> {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/feed";
  const auth = await getOptionalAuth();
  if (!auth) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (auth.adult) redirect(nextPath);
  const profile = await getUserProfile(auth.userId).catch(() => null);
  const known = profile?.dateOfBirth?.toISOString().slice(0, 10) ?? await getPageUserBirthDate() ?? "";
  return <main className="relative min-h-[100dvh] overflow-hidden">
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-4 pb-10 pt-8 sm:px-6">
      <ConfirmAgeForm nextPath={nextPath} initialDate={known} />
    </div>
  </main>;
}
