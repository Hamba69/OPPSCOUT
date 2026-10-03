import { randomUUID } from "node:crypto";
import { apiHandler, success } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { validateDocumentInput, storageClient } from "@/lib/documents";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { parseJson, profileDocumentSchema } from "@/lib/validation";

export async function POST(request: Request): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    requireRole(auth, ["user"]);
    const input = await parseJson(request, profileDocumentSchema);
    const extension = validateDocumentInput(input);
    const db = createServiceRoleClient();
    const { count, error: countError } = await db.from("StoredDocument").select("id", { count: "exact", head: true }).eq("ownerType", "user").eq("ownerId", auth.userId).eq("purpose", "research_paper").neq("status", "rejected");
    if (countError) throw new Error(`Could not count profile documents: ${countError.message}`);
    const limit = Number(process.env.PROFILE_DOCS_MAX_PER_USER ?? 3);
    if ((count ?? 0) >= limit) return Response.json({ error: { code: "DOCUMENT_LIMIT", message: `You can upload up to ${limit} papers.` } }, { status: 400 });
    const documentId = randomUUID();
    const path = `research/${auth.userId}/${documentId}/original${extension}`;
    const { data: row, error } = await db.from("StoredDocument").insert({ id: documentId, ownerType: "user", ownerId: auth.userId, purpose: "research_paper", title: input.title, description: input.description ?? null, originalFileName: input.fileName.replace(/[^\w.\- ]/g, "_").slice(0, 120), storagePath: path, mimeType: input.mimeType, sizeBytes: input.sizeBytes, status: "pending" }).select("id,storagePath").single();
    if (error || !row) throw new Error(`Could not create document record: ${error?.message ?? "unknown error"}`);
    const signed = await storageClient().createSignedUploadUrl(path);
    if (signed.error || !signed.data) {
      await db.from("StoredDocument").delete().eq("id", documentId);
      throw new Error(`Could not prepare document upload: ${signed.error?.message ?? "unknown error"}`);
    }
    return success({ documentId, uploadUrl: signed.data.signedUrl, token: signed.data.token, path: row.storagePath }, 201);
  });
}
