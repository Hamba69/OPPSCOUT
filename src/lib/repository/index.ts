import type { Repository } from "@/lib/repository/types";
import { MemoryRepository } from "@/lib/repository/memory";

const globalRepository = globalThis as unknown as { oppScoutRepository?: Repository };

export function isMemoryDataMode(): boolean {
  return process.env.NODE_ENV === "test";
}

export async function getRepository(): Promise<Repository> {
  if (globalRepository.oppScoutRepository) return globalRepository.oppScoutRepository;

  if (isMemoryDataMode()) {
    const repository: Repository = new MemoryRepository();
    globalRepository.oppScoutRepository = repository;
    return repository;
  }

  const { PrismaRepository } = await import("@/lib/repository/prisma");
  const repository: Repository = new PrismaRepository();
  globalRepository.oppScoutRepository = repository;
  return repository;
}

export function setRepositoryForTests(repository: Repository | undefined): void {
  if (process.env.NODE_ENV !== "test") throw new Error("Repository injection is only allowed in tests.");
  globalRepository.oppScoutRepository = repository;
}
