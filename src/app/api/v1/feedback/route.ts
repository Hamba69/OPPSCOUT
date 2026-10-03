import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api";
import { feedbackSchema } from "@/lib/admin-data";
import { getOptionalAuth } from "@/lib/auth";
import { cookieValue, requireSameOrigin } from "@/lib/admin-portal";
import { privacyHash, requestIpHash } from "@/lib/privacy-hash";
import { getRepository } from "@/lib/repository";
import { enforceRateLimit } from "@/lib/rate-limit";

function tokenFor(request: Request): string {const token=cookieValue(request,"oppscout_fb");return token && /^[A-Za-z0-9_-]{43}$/.test(token)?token:randomBytes(32).toString("base64url");}
function withCookie(response:NextResponse,token:string){response.cookies.set("oppscout_fb",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV!=="development",path:"/",maxAge:31536000});response.headers.set("Cache-Control","no-store");return response;}
async function visitor(request:Request){const token=tokenFor(request);const auth=await getOptionalAuth();const repository=await getRepository();const userId=auth && await repository.getProfile(auth.userId)?auth.userId:null;return {token,visitorHash:privacyHash(token,"visitor"),userId,repository};}
export async function GET(request:Request):Promise<Response>{return apiHandler(request,async()=>{const {token,visitorHash,userId,repository}=await visitor(request);return withCookie(NextResponse.json({submitted:await repository.hasFeedback(visitorHash,userId)}),token);});}
export async function POST(request:Request):Promise<Response>{return apiHandler(request,async()=>{
  requireSameOrigin(request);
  const input=feedbackSchema.parse(await request.json());
  if(input.website) return new NextResponse(null,{status:204});
  const {token,visitorHash,userId,repository}=await visitor(request),ipHash=requestIpHash(request);
  await enforceRateLimit("public",ipHash);
  await repository.createFeedback({category:input.category,rating:input.rating,message:input.message,contactEmail:input.contact?input.contactEmail||null:null,userId,visitorHash,ipHash,deviceClass:input.deviceClass,appVersion:process.env.VERCEL_GIT_COMMIT_SHA??null});
  return withCookie(new NextResponse(null,{status:204}),token);
});}
