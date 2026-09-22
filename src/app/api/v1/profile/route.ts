import { z } from "zod";

import { apiHandler, noContent, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { calculateProfileCompleteness } from "@/services/profile/completeness";
import { recomputeRankedFeed } from "@/services/matching/feed";
import { parseJson, profileSchema } from "@/lib/validation";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const repository = await getRepository();
    return success(await repository.getProfile(auth.userId));
  });
}

export async function POST(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const input = await parseJson(request, profileSchema.extend({ name: z.string().trim().min(2).max(120) }));
    const repository = await getRepository();
    const profileCompletenessScore = calculateProfileCompleteness(input);
    const profile = await repository.createProfile(auth.userId, { ...input, profileCompletenessScore });
    await recomputeRankedFeed(repository, auth.userId);
    return success(profile, 201);
  });
}

export async function PATCH(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const input = await parseJson(request, profileSchema);
    const repository = await getRepository();
    const current = await repository.getProfile(auth.userId);
    const profileCompletenessScore = calculateProfileCompleteness({ ...current, ...input });
    const profile = current
      ? await repository.updateProfile(auth.userId, { ...input, profileCompletenessScore })
      : await repository.createProfile(auth.userId, { ...input, profileCompletenessScore });
    await recomputeRankedFeed(repository, auth.userId);
    return success(profile);
  });
}

export async function DELETE(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const repository = await getRepository();
    await repository.deleteProfile(auth.userId);
    return noContent();
  });
}
