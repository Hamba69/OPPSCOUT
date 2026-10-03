import "server-only";

import { createHash } from "node:crypto";
import { AppError, ForbiddenError, NotFoundError } from "@/core/errors/app-error";
import type { AuthContext } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const DOCUMENT_LIMIT = 5_242_880;
export const DOCUMENT_MIMES = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
} as const;

export function documentExtension(fileName: string): keyof typeof DOCUMENT_MIMES {
  const extension = `.${fileName.toLowerCase().split(".").pop() ?? ""}` as keyof typeof DOCUMENT_MIMES;
  if (!(extension in DOCUMENT_MIMES)) throw new AppError("This file type is not supported.", 400, "UNSUPPORTED_FILE_TYPE");
  return extension;
}

export function validateDocumentInput(input: { title: string; description?: string; fileName: string; mimeType: string; sizeBytes: number }): keyof typeof DOCUMENT_MIMES {
  const extension = documentExtension(input.fileName);
  if (input.mimeType !== DOCUMENT_MIMES[extension]) throw new AppError("The file extension and type do not match.", 400, "MIME_MISMATCH");
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > DOCUMENT_LIMIT) throw new AppError("Files must be no larger than 5 MB.", 400, "FILE_TOO_LARGE");
  if (input.title.trim().length < 3 || input.title.trim().length > 120) throw new AppError("Paper titles must be between 3 and 120 characters.", 400, "INVALID_TITLE");
  if (input.description && input.description.trim().length > 300) throw new AppError("Descriptions must be 300 characters or fewer.", 400, "INVALID_DESCRIPTION");
  return extension;
}

export function hasDocumentSignature(bytes: Uint8Array, extension: keyof typeof DOCUMENT_MIMES): boolean {
  if (extension === ".pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (extension === ".png") return bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (extension === ".jpg" || extension === ".jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

export async function canAccessDocument(auth: AuthContext, document: { ownerId: string; ownerType: string; purpose: string; status: string; shareWithOrganizations: boolean }, context: { seeker: { dateOfBirth: Date | null; shareWithOrganizations: boolean } | null; organizationVerified: boolean; hasMatch: boolean }): Promise<boolean> {
  if (auth.role === "admin") return true;
  if (auth.role === "user" && document.ownerType === "user" && document.ownerId === auth.userId) return true;
  if (auth.role !== "organization" || document.ownerType !== "user" || document.purpose !== "research_paper") return false;
  if (!context.organizationVerified || document.status !== "ready" || !document.shareWithOrganizations || !context.seeker?.shareWithOrganizations || !context.hasMatch) return false;
  const dob = context.seeker.dateOfBirth;
  if (!dob) return false;
  const now = new Date();
  const age = now.getUTCFullYear() - dob.getUTCFullYear() - ((now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate())) ? 1 : 0);
  return age >= 18;
}

export async function hashBytes(bytes: Uint8Array): Promise<string> {
  return createHash("sha256").update(bytes).digest("hex");
}

export function storageClient() {
  return createServiceRoleClient().storage.from("profile-documents");
}

export function documentNotFound(): never {
  throw new NotFoundError("Document");
}

export function wrongRole(): never {
  throw new ForbiddenError();
}
