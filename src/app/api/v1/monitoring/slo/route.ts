import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { getSloSnapshot } from "@/services/monitoring/metrics";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["admin"]);
    return success(await getSloSnapshot(await getRepository()));
  });
}
