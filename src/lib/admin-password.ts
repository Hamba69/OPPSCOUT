import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";

const parameters={N:32768,r:8,p:1,maxmem:64*1024*1024};
const derive=(password: string,salt: Buffer)=>new Promise<Buffer>((resolve,reject)=>nodeScrypt(password,salt,64,parameters,(error,key)=>error?reject(error):resolve(key)));
export async function hashPortalPassword(password: string): Promise<string> {
  if(password.length<12 || password.length>200) throw new Error("Password must contain 12 to 200 characters.");
  const salt=randomBytes(16);const hash=await derive(password,salt);
  return `scrypt:32768:8:1:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}
export function validPasswordHash(value: string | undefined): boolean { return Boolean(value && /^scrypt:32768:8:1:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]{86}$/.test(value)); }
export async function verifyHash(password: string,encoded: string): Promise<boolean> {
  if(!validPasswordHash(encoded) || password.length>200) return false;
  const parts=encoded.split(":");const salt=Buffer.from(parts[4]!,"base64url"),expected=Buffer.from(parts[5]!,"base64url");
  if(salt.toString("base64url")!==parts[4] || expected.toString("base64url")!==parts[5]) return false;
  return timingSafeEqual(await derive(password,salt),expected);
}
