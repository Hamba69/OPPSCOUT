import "server-only";

import { redirect } from "next/navigation";

import { requirePageAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile-store";

export function isMatchingProfileReady(profile: Awaited<ReturnType<typeof getUserProfile>>): boolean {
  if (!profile) return false;
  return Boolean(profile.name.trim());
}

export async function requireSeekerProfile(nextPath: string): Promise<{ userId: string; profile: NonNullable<Awaited<ReturnType<typeof getUserProfile>>> }> {
  const { userId } = await requirePageAuth(["user"]);
  const profile = await getUserProfile(userId);
  if (!profile || !isMatchingProfileReady(profile)) redirect(`/profile?next=${encodeURIComponent(nextPath)}`);
  return { userId, profile };
}
