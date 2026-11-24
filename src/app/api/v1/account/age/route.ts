import { z } from "zod";

import { ValidationError } from "@/core/errors/app-error";
import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { recordAccountBirthDate } from "@/lib/account-birth-date";
import { dateOfBirthProblem } from "@/lib/date-of-birth";
import { getUserProfile, updateUserProfile } from "@/lib/profile-store";
import { parseJson } from "@/lib/validation";

const schema = z.object({ dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth.") });

/**
 * Confirms the signed-in person's date of birth. Only 18 or older is accepted (OppScout is adults only). The
 * date is recorded on the account, which unlocks the app, and on the profile if they have one.
 */
export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request, { allowUnconfirmedAge: true });
    const { dateOfBirth } = await parseJson(request, schema);
    const problem = dateOfBirthProblem(dateOfBirth);
    if (problem) throw new ValidationError(problem);
    await recordAccountBirthDate(auth.userId, dateOfBirth);
    if (await getUserProfile(auth.userId)) await updateUserProfile(auth.userId, { dateOfBirth: new Date(`${dateOfBirth}T00:00:00Z`) });
    return success({ confirmed: true });
  });
}
