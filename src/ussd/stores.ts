import { isMemoryDataMode } from "@/lib/repository";
import { MemoryUssdCredentialStore, RedisUssdCredentialStore, type UssdCredentialStore } from "@/ussd/auth";
import { MemoryUssdSessionStore, RedisUssdSessionStore, type UssdSessionStore } from "@/ussd/session-store";
const stores = globalThis as unknown as { oppScoutUssdSessions?: MemoryUssdSessionStore; oppScoutUssdCredentials?: MemoryUssdCredentialStore };
export function getUssdSessionStore(): UssdSessionStore { if (!isMemoryDataMode()) return new RedisUssdSessionStore(); stores.oppScoutUssdSessions ??= new MemoryUssdSessionStore(); return stores.oppScoutUssdSessions; }
export function getUssdCredentialStore(): UssdCredentialStore { if (!isMemoryDataMode()) return new RedisUssdCredentialStore(); stores.oppScoutUssdCredentials ??= new MemoryUssdCredentialStore(); return stores.oppScoutUssdCredentials; }
