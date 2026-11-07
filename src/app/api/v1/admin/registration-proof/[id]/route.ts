import { apiHandler } from "@/lib/api";
import { requireAdminPortalApi } from "@/lib/admin-portal";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { storageClient } from "@/lib/documents";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const response = await apiHandler(request, async () => {
    requireAdminPortalApi(request);
    const { id } = await context.params;
    const db = createServiceRoleClient();
    const { data: document, error } = await db.from("StoredDocument")
      .select("storagePath,originalFileName")
      .eq("id", id)
      .eq("ownerType", "user")
      .eq("purpose", "registration_proof")
      .eq("status", "ready")
      .maybeSingle();
    if (error) throw new Error(`Could not load URSB proof document: ${error.message}`);
    if (!document) return Response.json({ error: { code: "NOT_FOUND", message: "Registration proof was not found." } }, { status: 404 });
    const signed = await storageClient().createSignedUrl(document.storagePath, 60, { download: document.originalFileName });
    if (signed.error || !signed.data) throw new Error(`Could not create registration proof URL: ${signed.error?.message ?? "unknown error"}`);
    return new Response(null, { status: 302, headers: { Location: signed.data.signedUrl } });
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
