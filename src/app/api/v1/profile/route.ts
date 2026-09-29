import { z } from "zod";

import { apiHandler, noContent, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { createUserProfile, deleteUserProfile, getUserProfile, updateUserProfile } from "@/lib/profile-store";
import { calculateProfileCompleteness } from "@/services/profile/completeness";
import { parseJson, profileSchema } from "@/lib/validation";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    return success(await getUserProfile(auth.userId));
  });
}

export async function POST(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const input = await parseJson(request, profileSchema.extend({ name: z.string().trim().min(2).max(120) }));
    const profileCompletenessScore = calculateProfileCompleteness(input);
    const profile = await createUserProfile(auth.userId, { ...input, profileCompletenessScore });
    return success(profile, 201);
  });
}

export async function PATCH(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const input = await parseJson(request, profileSchema);
    const current = await getUserProfile(auth.userId);
    const profileCompletenessScore = calculateProfileCompleteness({ ...current, ...input });
    const profile = current
      ? await updateUserProfile(auth.userId, { ...input, profileCompletenessScore })
      : await createUserProfile(auth.userId, { ...input, profileCompletenessScore });
    return success(profile);
  });
}

export async function DELETE(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    await deleteUserProfile(auth.userId);
    return noContent();
  });
}
