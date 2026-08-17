import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const profile = await (await getRepository()).getProfile(auth.userId);
    return success({ score: profile?.profileCompletenessScore ?? 0, complete: profile?.profileCompletenessScore === 100 });
  });
}
