import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { calculateProfileCompleteness } from "@/services/profile/completeness";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const profile = await (await getRepository()).getProfile(auth.userId);
    const score = profile ? calculateProfileCompleteness(profile) : 0;
    return success({ score, complete: score === 100 });
  });
}
