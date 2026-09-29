import "server-only";

import { PrismaClient } from "@prisma/client";

const globalDatabase = globalThis as unknown as { oppScoutPrisma?: PrismaClient };

export const prisma = globalDatabase.oppScoutPrisma ?? new PrismaClient();

globalDatabase.oppScoutPrisma = prisma;
