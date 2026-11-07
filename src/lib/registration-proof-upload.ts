"use client";

import { createClient } from "@/lib/supabase/client";

export async function uploadRegistrationProof(file: File): Promise<string> {
  const response = await fetch("/api/v1/profile/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "URSB registration proof",
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      purpose: "registration_proof",
    }),
  });
  if (!response.ok) {
    const result = await response.json() as { error?: { message?: string } };
    throw new Error(result.error?.message ?? "Could not prepare proof upload. Use a supported document no larger than 5 MB.");
  }
  const result = await response.json() as { data: { documentId: string; token: string; path: string } };
  const { error } = await createClient().storage
    .from("profile-documents")
    .uploadToSignedUrl(result.data.path, result.data.token, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Could not upload the URSB proof document. Please try again.");
  const complete = await fetch(`/api/v1/profile/documents/${result.data.documentId}/complete`, { method: "POST" });
  if (!complete.ok) throw new Error("The URSB proof upload could not be verified. Please try another file.");
  return result.data.documentId;
}
