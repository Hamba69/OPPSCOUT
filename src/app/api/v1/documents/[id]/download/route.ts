import { apiHandler, success } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { canAccessDocument, storageClient } from "@/lib/documents";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return apiHandler(request, async () => {
    const auth = await requireAuth(request);
    const { id } = await context.params;
    const db = createServiceRoleClient();
    const { data: document } = await db.from("StoredDocument").select("*").eq("id", id).maybeSingle();
    if (!document) return Response.json({ error: { code: "NOT_FOUND", message: "Document not found." } }, { status: 404 });
    const { data: seeker } = document.ownerType === "user" ? await db.from("UserProfile").select("dateOfBirth,shareWithOrganizations").eq("id", document.ownerId).maybeSingle() : { data: null };
    let organizationVerified = false;
    let hasMatch = false;
    if (auth.role === "organization" && auth.organizationId && document.ownerType === "user") {
      const org = await db.from("Organization").select("verificationStatus").eq("id", auth.organizationId).maybeSingle();
      organizationVerified = org.data?.verificationStatus === "verified";
      const matches = await db.from("MatchResult").select("id,Opportunity!inner(organizationId,status,verificationStatus)").eq("userId", document.ownerId).eq("Opportunity.organizationId", auth.organizationId).eq("Opportunity.status", "open").eq("Opportunity.verificationStatus", "verified").gte("score", Number(process.env.MATCH_RELEVANCE_THRESHOLD ?? 60)).limit(1);
      hasMatch = Boolean(matches.data?.length);
    }
    if (!await canAccessDocument(auth, document, { seeker, organizationVerified, hasMatch })) return Response.json({ error: { code: "NOT_FOUND", message: "Document not found." } }, { status: 404 });
    if (auth.role === "organization" && auth.organizationId) await db.from("SeekerAccessLog").insert({ organizationId: auth.organizationId, seekerId: document.ownerId, action: "download_document", documentId: id });
    const signed = await storageClient().createSignedUrl(document.storagePath, 60, { download: document.originalFileName });
    if (signed.error || !signed.data) throw new Error(`Could not create document URL: ${signed.error?.message ?? "unknown error"}`);
    return success({ url: signed.data.signedUrl, expiresInSeconds: 60 });
  });
}
