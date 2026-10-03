import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api";
import { ADMIN_HEADERS, portalCookieName, portalCookieOptions, requireAdminPortalApi, requireSameOrigin } from "@/lib/admin-portal";
export async function POST(request:Request):Promise<Response>{return apiHandler(request,async()=>{requireAdminPortalApi(request);requireSameOrigin(request);const response=new NextResponse(null,{status:204,headers:ADMIN_HEADERS});response.cookies.set(portalCookieName(),"",{...portalCookieOptions(),maxAge:0});return response;});}
