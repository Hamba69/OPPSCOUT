import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppError } from "@/core/errors/app-error";
import { validPasswordHash, verifyHash } from "@/lib/admin-password";

let reported=false;
export async function verifyPortalPassword(password: string): Promise<boolean> {
  const encoded=process.env.ADMIN_PORTAL_PASSWORD_HASH;
  if(!validPasswordHash(encoded)) { if(!reported) {console.error("Admin portal password hash is missing or malformed.");reported=true;}return false; }
  try {return await verifyHash(password,encoded!);} catch {return false;}
}
function secret(): Buffer | null { const value=process.env.ADMIN_PORTAL_SESSION_SECRET;if(!value || !/^[A-Za-z0-9_-]+$/.test(value)) return null;const bytes=Buffer.from(value,"base64url");return bytes.length>=32 && bytes.toString("base64url")===value ? bytes : null; }
export function createPortalSession(now=Date.now()): string { const key=secret();if(!key) throw new AppError("Admin sessions are not configured.",503,"ADMIN_NOT_CONFIGURED");const message=`v1.${Math.floor(now/1000)+7200}.${randomBytes(24).toString("base64url")}`;return `${message}.${createHmac("sha256",key).update(message).digest("base64url")}`; }
export function verifyPortalSession(value: string | undefined,now=Date.now()): boolean {
  const key=secret();if(!key || !value || !/^v1\.\d{10}\.[A-Za-z0-9_-]{32}\.[A-Za-z0-9_-]{43}$/.test(value)) return false;
  const [version,expiry,nonce,signature]=value.split(".");const seconds=Math.floor(now/1000);
  if(Number(expiry)<=seconds || Number(expiry)>seconds+7200) return false;
  const expected=createHmac("sha256",key).update(`${version}.${expiry}.${nonce}`).digest();const actual=Buffer.from(signature!,"base64url");
  return actual.length===expected.length && actual.toString("base64url")===signature && timingSafeEqual(expected,actual);
}
export function portalCookieName(): string {return process.env.NODE_ENV==="development"?"oppscout_admin":"__Host-oppscout_admin";}
export function portalCookieOptions() {return {httpOnly:true,secure:process.env.NODE_ENV!=="development",sameSite:"strict" as const,path:"/",maxAge:7200};}
export function cookieValue(request: Request,name: string): string | undefined {return request.headers.get("cookie")?.split(";").map(c=>c.trim()).find(c=>c.startsWith(`${name}=`))?.slice(name.length+1);}
export async function requireAdminPortal(): Promise<void> {if(!verifyPortalSession((await cookies()).get(portalCookieName())?.value)) redirect("/settings?unlock=1");}
export function requireAdminPortalApi(request: Request): void {if(!verifyPortalSession(cookieValue(request,portalCookieName()))) throw new AppError("Admin access required.",401,"ADMIN_REQUIRED");}
export function requireSameOrigin(request: Request): void {const expected=process.env.OPPSCOUT_APP_URL;let origin:string;try{origin=new URL(expected??"").origin;}catch{throw new AppError("Application origin is not configured.",503,"ORIGIN_NOT_CONFIGURED");}if(request.headers.get("origin")!==origin) throw new AppError("Request origin is not allowed.",403,"ORIGIN_REQUIRED");}
export const ADMIN_HEADERS={"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"};
