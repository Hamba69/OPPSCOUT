import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * Records a validated date of birth on the sign-in account, which is what the adults-only check reads. Done
 * with the service role so it works for cookie and bearer sessions alike; Supabase merges it into the
 * account's existing metadata.
 */
export async function recordAccountBirthDate(userId: string, dateOfBirth: Date | string): Promise<void> {
  const value = typeof dateOfBirth === "string" ? dateOfBirth.slice(0, 10) : dateOfBirth.toISOString().slice(0, 10);
  const { error } = await createServiceRoleClient().auth.admin.updateUserById(userId, { user_metadata: { dateOfBirth: value } });
  if (error) throw new Error(`Could not record the date of birth: ${error.message}`);
}
