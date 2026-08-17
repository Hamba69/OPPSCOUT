import type { ShadowCandidate, ShadowOpportunityStore } from "@/services/ingestion/scraping/types";
export class MemoryShadowOpportunityStore implements ShadowOpportunityStore {
  private readonly candidates = new Map<string, ShadowCandidate>();
  public async put(candidate: ShadowCandidate): Promise<void> { this.candidates.set(candidate.id, structuredClone(candidate)); }
  public async list(): Promise<ShadowCandidate[]> { return structuredClone([...this.candidates.values()]); }
}
