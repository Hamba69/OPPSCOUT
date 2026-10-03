import { recordApiSample } from "@/services/monitoring/metrics";
import { getRepository } from "@/lib/repository";
export function recordUssdOutcome(completed: boolean, durationMs = 0): void { recordApiSample({kind:"ussd",route:"/api/v1/ussd/session",method:"POST",status:200,ok:completed,durationMs:Math.round(durationMs)}); }
export async function getUssdCompletionMetric(): Promise<{ value: number | null; samples: number }> { const {headlines:h}=await (await getRepository()).adminSnapshot(new Date(Date.now()-30*86400000),new Date());const samples=Number(h.ussdSamples);return {value:samples?Number((Number(h.ussdOk)/samples*100).toFixed(2)):null,samples}; }
