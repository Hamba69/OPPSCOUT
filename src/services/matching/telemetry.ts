import { AsyncLocalStorage } from "node:async_hooks";
import type { UnmatchedInput } from "@/lib/admin-data";

export const matchTerms = new AsyncLocalStorage<Map<string,UnmatchedInput>>();
export function observeUnmatched(kind: UnmatchedInput["kind"], value: string): void {
  const store=matchTerms.getStore(); if(!store) return;
  const term=value.toLowerCase().trim().slice(0,80);
  if(term && store.size<1000) store.set(`${kind}:${term}`,{kind,term});
}
export function scoreHistogram(scores: number[]): number[] { const bins=Array<number>(10).fill(0);for(const score of scores) bins[Math.max(0,Math.min(9,Math.floor(score/10)))]!++;return bins; }
