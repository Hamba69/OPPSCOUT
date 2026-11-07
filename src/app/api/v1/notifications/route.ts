import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const repository = await getRepository();
    const [notifications, matches] = await Promise.all([
      repository.listNotifications(auth.userId),
      buildRankedFeed(repository, auth.userId, new Date(), undefined, { persist: false, telemetry: false }),
    ]);
    const relevantMatchIds = new Set(matches.map((match) => match.id));
    return success(notifications.filter((notification) => notification.matchId !== null && relevantMatchIds.has(notification.matchId)));
  });
}
