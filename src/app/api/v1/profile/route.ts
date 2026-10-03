import { z } from "zod";

import { ValidationError } from "@/core/errors/app-error";
import { apiHandler, noContent, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { createUserProfile, deleteUserProfile, getUserProfile, updateUserProfile } from "@/lib/profile-store";
import { calculateProfileCompleteness } from "@/services/profile/completeness";
import { ORG_SHARING_CONSENT_VERSION, parseJson, profileSchema } from "@/lib/validation";

function isAdult(dateOfBirth: Date | null | undefined): boolean {
  if (!dateOfBirth) return false;
  const today = new Date();
  let age = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const birthdayPassed = today.getUTCMonth() > dateOfBirth.getUTCMonth()
    || (today.getUTCMonth() === dateOfBirth.getUTCMonth() && today.getUTCDate() >= dateOfBirth.getUTCDate());
  if (!birthdayPassed) age -= 1;
  return age >= 18;
}

export async function GET(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    return success(await getUserProfile(auth.userId));
  });
}

export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const input = await parseJson(request, profileSchema.extend({ name: z.string().trim().min(2).max(120) }));
    const profileCompletenessScore = calculateProfileCompleteness(input);
    const profile = await createUserProfile(auth.userId, { ...input, profileCompletenessScore });
    return success(profile, 201);
  });
}

export async function PATCH(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
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
    return success(profile);
  });
}

export async function DELETE(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    await deleteUserProfile(auth.userId);
    return noContent();
  });
}
