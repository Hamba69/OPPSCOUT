"use client";
import { useReportWebVitals } from "next/web-vitals";
import { deviceClass, routeTemplate } from "@/lib/route-template";

const pending = new Map<string, unknown>();
let timer: ReturnType<typeof setTimeout> | undefined;
function flush() {
  if(!pending.size) return;
  const body=JSON.stringify([...pending.values()]);pending.clear();
  if(navigator.sendBeacon?.("/api/v1/telemetry/vitals",new Blob([body],{type:"application/json"}))) return;
  void fetch("/api/v1/telemetry/vitals",{method:"POST",body,headers:{"content-type":"application/json"},keepalive:true}).catch(()=>{});
}
const report: Parameters<typeof useReportWebVitals>[0] = sample => {
  if(!["LCP","INP","CLS","FCP","TTFB"].includes(sample.name)) return;
  pending.set(sample.id,{route:routeTemplate(window.location.pathname),metric:sample.name,value:sample.value,rating:sample.rating,deviceClass:deviceClass(window.innerWidth,navigator.userAgent)});
  clearTimeout(timer);timer=setTimeout(flush,500);
  if(document.visibilityState==="hidden") flush();
};
export function WebVitals(): null { useReportWebVitals(report);return null; }
