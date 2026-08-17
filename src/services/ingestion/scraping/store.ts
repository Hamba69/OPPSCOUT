import { isMemoryDataMode } from "@/lib/repository";
import { MemoryShadowOpportunityStore } from "@/services/ingestion/scraping/memory-shadow-store";
import { SupabaseShadowOpportunityStore } from "@/services/ingestion/scraping/supabase-shadow-store";
import type { ShadowOpportunityStore } from "@/services/ingestion/scraping/types";
const globalStore = globalThis as unknown as { oppScoutShadowStore?: MemoryShadowOpportunityStore };
export function getShadowOpportunityStore(): ShadowOpportunityStore { if (!isMemoryDataMode()) return new SupabaseShadowOpportunityStore(); globalStore.oppScoutShadowStore ??= new MemoryShadowOpportunityStore(); return globalStore.oppScoutShadowStore; }
