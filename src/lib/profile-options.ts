import "server-only";

import { getRepository } from "@/lib/repository";
import { buildProfileChoices, type ProfileChoices } from "@/services/profile/choices";

export async function getProfileChoices(): Promise<ProfileChoices> {
  const repository = await getRepository();
  // Send vocabulary only to the form, never listing content or account records.
  return buildProfileChoices(await repository.listOpportunities());
}
