import { requireAdminPortalApi } from "@/lib/admin-portal";
import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";
import { getKpiSnapshot } from "@/services/kpi/dashboard";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    requireAdminPortalApi(request);
    return success(await getKpiSnapshot(await getRepository()));
  });
}
