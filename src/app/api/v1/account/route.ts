import { z } from "zod";

import { requireSameOrigin } from "@/lib/admin-portal";
import { apiHandler, noContent } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseJson } from "@/lib/validation";
import { deleteAccount } from "@/services/account/account-data";

/** Settings > Delete account. The person types DELETE to confirm; the account and personal data are removed. */
export async function DELETE(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    requireSameOrigin(request);
    const auth = await requireAuth(request, { allowUnconfirmedAge: true });
    await parseJson(request, z.object({ confirm: z.literal("DELETE") }).strict());
    await deleteAccount(auth.userId);
    // Clear the session cookies; the sign-in account no longer exists.
    try { await (await createClient()).auth.signOut(); } catch { /* Already signed out. */ }
    return noContent();
  });
}
