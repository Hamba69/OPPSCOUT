import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { documentExtension, hasDocumentSignature, storageClient, hashBytes } from "@/lib/documents";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["user"]);
    const { id } = await context.params;
    const db = createServiceRoleClient();
    const { data: row, error } = await db.from("StoredDocument").select("*").eq("id", id).eq("ownerId", auth.userId).maybeSingle();
    if (error) throw new Error(`Could not read document: ${error.message}`);
    if (!row) return Response.json({ error: { code: "NOT_FOUND", message: "Document not found." } }, { status: 404 });
    const object = await storageClient().download(row.storagePath);
    if (object.error || !object.data) {
      await db.from("StoredDocument").update({ status: "rejected" }).eq("id", id);
      return Response.json({ error: { code: "UPLOAD_INVALID", message: "The uploaded file could not be verified." } }, { status: 400 });
    }
    const bytes = new Uint8Array(await object.data.arrayBuffer());
    const extension = documentExtension(row.originalFileName);
    if (bytes.byteLength > 5_242_880 || !hasDocumentSignature(bytes, extension)) {
      await storageClient().remove([row.storagePath]);
      await db.from("StoredDocument").update({ status: "rejected" }).eq("id", id);
      return Response.json({ error: { code: "UPLOAD_INVALID", message: "The file contents do not match the declared type." } }, { status: 400 });
    }
    const sha256 = await hashBytes(bytes);
    const { data: updated, error: updateError } = await db.from("StoredDocument").update({ status: "ready", sizeBytes: bytes.byteLength, sha256, updatedAt: new Date().toISOString() }).eq("id", id).select("id,title,status,sizeBytes,sha256,createdAt").single();
    if (updateError) throw new Error(`Could not complete document upload: ${updateError.message}`);
    return success(updated);
  });
}
