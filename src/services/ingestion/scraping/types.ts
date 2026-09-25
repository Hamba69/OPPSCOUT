import type { OpportunityInput } from "@/lib/repository/types";
export type ShadowOpportunityInput = Omit<OpportunityInput, "deadline" | "publicationDate" | "checkedAt"> & { deadline: string | null };
export interface ShadowCandidate { id: string; sourceUrl: string; capturedAt: string; input: ShadowOpportunityInput; duplicateOpportunityId: string | null; freshnessError: boolean; trustSignals: string[]; }
export interface ShadowOpportunityStore { put(candidate: ShadowCandidate): Promise<void>; list(): Promise<ShadowCandidate[]>; }
