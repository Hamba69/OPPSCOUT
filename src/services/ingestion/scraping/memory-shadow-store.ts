import type { ShadowCandidate, ShadowOpportunityStore } from "@/services/ingestion/scraping/types";
import { SCRAPING_RULES } from "@/config/scraping-rules";
export class MemoryShadowOpportunityStore implements ShadowOpportunityStore {
  private readonly candidates = new Map<string, ShadowCandidate>();
  public async put(candidate: ShadowCandidate): Promise<void> { this.candidates.set(candidate.id, structuredClone(candidate)); }
  public async list(): Promise<ShadowCandidate[]> { return structuredClone([...this.candidates.values()]); }
  public async prune(now = new Date()): Promise<number> {
    let removed = 0;
    for (const [id, candidate] of this.candidates) {
      const deadline = candidate.input.deadline ? new Date(candidate.input.deadline) : null;
      const expired = deadline !== null && deadline <= now;
      const tooOld = now.getTime() - new Date(candidate.capturedAt).getTime() > SCRAPING_RULES.shadowCandidateRetentionDays * 86_400_000;
      if (expired || tooOld) {
        this.candidates.delete(id);
        removed += 1;
      }
    }
    return removed;
  }
}
