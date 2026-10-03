import { z } from "zod";
import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api";
import { getOptionalAuth } from "@/lib/auth";
import { AppError } from "@/core/errors/app-error";
import { ADMIN_HEADERS, createPortalSession, portalCookieName, portalCookieOptions, requireSameOrigin, verifyPortalPassword } from "@/lib/admin-portal";
import { requestIpHash } from "@/lib/privacy-hash";
import { reserveUnlock } from "@/lib/admin-unlock-limit";
import { getRepository } from "@/lib/repository";

export async function POST(request: Request): Promise<Response> {
  const response=await apiHandler(request,async()=>{
    requireSameOrigin(request);
    if(!await getOptionalAuth()) throw new AppError("Sign in to open Settings.",401,"UNAUTHENTICATED");
    const ipHash=requestIpHash(request),repository=await getRepository();const started=Date.now();let unlocked=false;
    try {
      const release=await reserveUnlock(ipHash);
      const {password}=z.object({password:z.string().max(200)}).strict().parse(await request.json());
      if(!await verifyPortalPassword(password)) throw new AppError("Incorrect password.",401,"INCORRECT_PASSWORD");
      const session=createPortalSession();await release();unlocked=true;
      const result=new NextResponse(null,{status:204,headers:ADMIN_HEADERS});result.cookies.set(portalCookieName(),session,portalCookieOptions());return result;
    } finally {
      await repository.writeAdminAccessLog({event:unlocked?"unlock_success":"unlock_failure",ipHash,userAgent:(request.headers.get("user-agent")??"").slice(0,200),detail:{}});
      await new Promise(resolve=>setTimeout(resolve,Math.max(0,400-(Date.now()-started))));
    }
  });
  for(const [key,value] of Object.entries(ADMIN_HEADERS)) response.headers.set(key,value);return response;
}
