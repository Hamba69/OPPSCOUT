import { ValidationError } from "@/core/errors/app-error";
import { apiHandler, noContent, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { createUserProfile, deleteUserProfile, getUserProfile, updateUserProfile } from "@/lib/profile-store";
import { calculateProfileCompleteness } from "@/services/profile/completeness";
import { newProfileSchema, ORG_SHARING_CONSENT_VERSION, parseJson, profileSchema } from "@/lib/validation";
import { recordAccountBirthDate } from "@/lib/account-birth-date";
import { dateOfBirthProblem } from "@/lib/date-of-birth";

const isAdult = (dateOfBirth: Date | null | undefined): boolean => Boolean(dateOfBirth) && dateOfBirthProblem(dateOfBirth) === null;

/** Keeps the account's date of birth (read by the adults-only check) in step with the profile. */
async function syncAccountBirthDate(userId: string, dateOfBirth: Date | null | undefined): Promise<void> {
  if (dateOfBirth && isAdult(dateOfBirth)) await recordAccountBirthDate(userId, dateOfBirth);
}

export async function GET(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request, { allowUnconfirmedAge: true });
    return success(await getUserProfile(auth.userId));
  });
}

export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request, { allowUnconfirmedAge: true });
    const input = await parseJson(request, newProfileSchema);
    const profileCompletenessScore = calculateProfileCompleteness(input);
    const profile = await createUserProfile(auth.userId, { ...input, profileCompletenessScore });
    await syncAccountBirthDate(auth.userId, profile.dateOfBirth);
    return success(profile, 201);
  });
}

export async function PATCH(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request, { allowUnconfirmedAge: true });
    const input = await parseJson(request, profileSchema);
    const current = await getUserProfile(auth.userId);
    const requested = { ...input };
    delete requested.orgSharingConsentAt;
    delete requested.orgSharingConsentVersion;
    const merged = { ...current, ...requested };
    if ((requested.shareWithOrganizations || requested.shareContactDetails) && !isAdult(merged.dateOfBirth)) {
      throw new ValidationError("Organization sharing is available only to seekers aged 18 or older with a date of birth.");
    }
    const consent = requested.shareWithOrganizations === true
      ? { orgSharingConsentAt: new Date(), orgSharingConsentVersion: ORG_SHARING_CONSENT_VERSION }
      : requested.shareWithOrganizations === false
        ? { orgSharingConsentAt: null, orgSharingConsentVersion: null }
        : {};
    const profileCompletenessScore = calculateProfileCompleteness(merged);
    const profile = current
      ? await updateUserProfile(auth.userId, { ...requested, ...consent, profileCompletenessScore })
      : await createUserProfile(auth.userId, { ...requested, ...consent, profileCompletenessScore });
    await syncAccountBirthDate(auth.userId, profile.dateOfBirth);
    return success(profile);
  });
}

export async function DELETE(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request, { allowUnconfirmedAge: true });
    await deleteUserProfile(auth.userId);
    return noContent();
  });
}
