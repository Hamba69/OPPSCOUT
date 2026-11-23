import { apiHandler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile-store";
import { exportAccountData } from "@/services/account/account-data";

/** Settings > Download my data: a JSON file of everything OppScout holds about the signed-in person. */
export async function GET(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const profile = await getUserProfile(auth.userId);
    const now = new Date();
    const data = await exportAccountData(auth.userId, profile?.email ?? null, now);
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="oppscout-data-${now.toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  });
}
