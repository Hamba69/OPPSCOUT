import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const auth = await requireAuth(request);
    return success(await (await getRepository()).listNotifications(auth.userId));
  });
}
