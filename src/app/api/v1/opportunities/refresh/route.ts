import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { refreshOpportunityLifecycle } from "@/services/ingestion/freshness";

export async function POST(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["admin"]);
    return success(await refreshOpportunityLifecycle(await getRepository()));
  });
}
