import { parseAdminQuery } from "@/lib/admin-data";
import { requireAdminPortalApi } from "@/lib/admin-portal";
import { apiHandler, success } from "@/lib/api";
import { getRepository } from "@/lib/repository";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    requireAdminPortalApi(request);
    const params=new URL(request.url).searchParams; if(!params.has("verificationStatus"))params.set("verificationStatus","pending");
    const page = await (await getRepository()).adminPage("organizations", parseAdminQuery("organizations", params));
    return success(page.rows);
  });
}
