import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    const matches = await buildRankedFeed(await getRepository(), auth.userId);
    const freshest = matches.reduce((date, item) => item.opportunity && item.opportunity.checkedAt > date ? item.opportunity.checkedAt : date, new Date(0));
    return success(matches, 200, freshest.getTime() ? freshest : new Date());
  });
}
