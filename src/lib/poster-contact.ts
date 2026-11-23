import "server-only";

import { getPageUserEmail } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

/** Prefill for the "Your contact details" section: the profile's name and phone, and the account email. */
export async function defaultPosterContact(userId: string): Promise<{ name: string; email: string; phone: string }> {
  const [profile, email] = await Promise.all([(await getRepository()).getProfile(userId), getPageUserEmail()]);
  return { name: profile?.name ?? "", email: profile?.email ?? email ?? "", phone: profile?.phone ?? "" };
}
