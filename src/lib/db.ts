import "server-only";

import { PrismaClient } from "@prisma/client";

function isProductionUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const { hostname } = new URL(value);
    return hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "0.0.0.0" && !hostname.endsWith(".local");
  } catch {
    return false;
  }
}

if (process.env.OPPSCOUT_DATA_MODE === "memory" && (process.env.VERCEL_ENV === "production" || (process.env.NODE_ENV === "production" && isProductionUrl(process.env.OPPSCOUT_APP_URL)))) {
  throw new Error("Memory mode is disabled in production. Set OPPSCOUT_DATA_MODE=prisma and remove demo overrides.");
}

if (process.env.OPPSCOUT_DEMO_MODE === "1" && (process.env.VERCEL_ENV === "production" || (process.env.NODE_ENV === "production" && isProductionUrl(process.env.OPPSCOUT_APP_URL)))) {
  throw new Error("Demo mode is disabled in production. Remove OPPSCOUT_DEMO_MODE=1.");
}

const globalDatabase = globalThis as unknown as { oppScoutPrisma?: PrismaClient };

export const prisma = globalDatabase.oppScoutPrisma ?? new PrismaClient();

globalDatabase.oppScoutPrisma = prisma;
