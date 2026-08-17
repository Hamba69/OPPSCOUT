import { z } from "zod";

import { apiHandler, noContent, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { calculateProfileCompleteness } from "@/services/profile/completeness";
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
    return success(await repository.createProfile(auth.userId, { ...input, profileCompletenessScore }), 201);
  });
}

export async function PATCH(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const input = await parseJson(request, profileSchema);
    const repository = await getRepository();
    const current = await repository.getProfile(auth.userId);
    const profileCompletenessScore = calculateProfileCompleteness({ ...current, ...input });
    return success(await repository.updateProfile(auth.userId, { ...input, profileCompletenessScore }));
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
