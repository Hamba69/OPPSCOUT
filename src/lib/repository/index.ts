import "server-only";

import type { Repository } from "@/lib/repository/types";
import { MemoryRepository } from "@/lib/repository/memory";

const globalRepository = globalThis as unknown as {
  oppScoutRepository?: Repository;
  oppScoutRepositoryTransport?: "memory" | "supabase-rest";
};

export function isMemoryDataMode(): boolean {
  return process.env.NODE_ENV === "test";
}

export async function getRepository(): Promise<Repository> {
  const transport = isMemoryDataMode() ? "memory" : "supabase-rest";
  if (globalRepository.oppScoutRepository && globalRepository.oppScoutRepositoryTransport === transport) {
    return globalRepository.oppScoutRepository;
  }

  if (isMemoryDataMode()) {
    const repository: Repository = new MemoryRepository();
    globalRepository.oppScoutRepository = repository;
    globalRepository.oppScoutRepositoryTransport = transport;
    return repository;
  }

  const { SupabaseRepository } = await import("@/lib/repository/supabase");
  const repository: Repository = new SupabaseRepository();
  globalRepository.oppScoutRepository = repository;
  globalRepository.oppScoutRepositoryTransport = transport;
  return repository;
}

export function setRepositoryForTests(repository: Repository | undefined): void {
  if (process.env.NODE_ENV !== "test") throw new Error("Repository injection is only allowed in tests.");
  globalRepository.oppScoutRepository = repository;
  globalRepository.oppScoutRepositoryTransport = repository ? "memory" : undefined;
}
