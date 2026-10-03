import { requireAdminPortalApi } from "@/lib/admin-portal";
import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { refreshOpportunityLifecycle } from "@/services/ingestion/freshness";

export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    requireAdminPortalApi(request);
    return success(await refreshOpportunityLifecycle(await getRepository()));
  });
}
