import "server-only";
import { createHmac } from "node:crypto";
import { AppError } from "@/core/errors/app-error";

export function privacyHash(value: string, purpose: "ip" | "visitor"): string {
  const salt=process.env.PRIVACY_HASH_SALT;
  if(!salt || salt.length<32) throw new AppError("Privacy protection is not configured.",503,"PRIVACY_NOT_CONFIGURED");
  return createHmac("sha256",salt).update(`${purpose}:${value}`).digest("hex");
}
export function requestIpHash(request: Request): string {
  // Vercel supplies this header; local development uses the loopback fallback.
  const ip=request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return privacyHash(ip,"ip");
}
