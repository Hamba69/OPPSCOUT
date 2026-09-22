import type { Repository } from "@/lib/repository/types";
import { MemoryRepository } from "@/lib/repository/memory";

const globalRepository = globalThis as unknown as { oppScoutRepository?: Repository };

function isProductionUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const { hostname } = new URL(value);
    return hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "0.0.0.0" && !hostname.endsWith(".local");
  } catch {
    return false;
  }
}

export function isProductionEnvironment(): boolean {
  if (process.env.VERCEL_ENV === "production") return true;
  if (process.env.NODE_ENV !== "production") return false;
  return isProductionUrl(process.env.OPPSCOUT_APP_URL);
}

export function isDemoModeEnabled(): boolean {
  return process.env.OPPSCOUT_DEMO_MODE === "1" && (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development");
}

export function isMemoryDataMode(): boolean {
  if (process.env.NODE_ENV === "test") return true;

  if (process.env.OPPSCOUT_DATA_MODE === "memory") {
    if (isProductionEnvironment()) {
      throw new Error("Memory mode cannot be enabled in production. Set OPPSCOUT_DATA_MODE=prisma and remove demo overrides.");
    }
    return true;
  }

  if (process.env.OPPSCOUT_DEMO_MODE === "1" && (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development")) {
    return true;
  }

  return process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL;
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
