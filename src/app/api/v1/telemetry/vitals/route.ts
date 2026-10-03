import { z } from "zod";
import { ROUTE_TEMPLATES } from "@/lib/route-template";
import { getRepository } from "@/lib/repository";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestIpHash } from "@/lib/privacy-hash";
import { deferTelemetry } from "@/lib/telemetry";

const vitalSchema=z.object({route:z.string().refine(value=>ROUTE_TEMPLATES.includes(value)),metric:z.enum(["LCP","INP","CLS","FCP","TTFB"]),value:z.number().finite().min(0).max(300000),rating:z.enum(["good","needs-improvement","poor"]),deviceClass:z.enum(["mobile","tablet","desktop"])}).strict().refine(sample=>sample.metric!=="CLS" || sample.value<=100);
export async function POST(request: Request): Promise<Response> {
  try {
    if(Number(request.headers.get("content-length"))>8192) return new Response(null,{status:204});
    const text=await request.text(); if(text.length>8192) return new Response(null,{status:204});
    const samples=z.array(vitalSchema).min(1).max(20).parse(JSON.parse(text));
    const ipHash=requestIpHash(request);
    deferTelemetry(async()=>{ await enforceRateLimit("public",ipHash);await (await getRepository()).writeWebVitals(samples.map(s=>({...s,rating:ratingFor(s.metric,s.value)}))); });
  } catch { /* Invalid or unavailable telemetry is deliberately dropped. */ }
  return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
}
function ratingFor(metric: string,value: number): "good" | "needs-improvement" | "poor" { const limits: Record<string,[number,number]>={LCP:[2500,4000],INP:[200,500],CLS:[.1,.25],FCP:[1800,3000],TTFB:[800,1800]};const [good,poor]=limits[metric]!;return value<=good?"good":value<=poor?"needs-improvement":"poor"; }
