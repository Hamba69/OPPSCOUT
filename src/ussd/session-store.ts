import { USSD_RULES } from "@/config/ussd-rules";
import { AppError } from "@/core/errors/app-error";
import type { UssdSession } from "@/ussd/types";
export interface UssdSessionStore { get(id: string): Promise<UssdSession | null>; set(session: UssdSession): Promise<void>; delete(id: string): Promise<void>; }
export class MemoryUssdSessionStore implements UssdSessionStore { private readonly sessions = new Map<string, UssdSession>(); public async get(id: string): Promise<UssdSession | null> { return structuredClone(this.sessions.get(id) ?? null); } public async set(session: UssdSession): Promise<void> { this.sessions.set(session.sessionId, structuredClone(session)); } public async delete(id: string): Promise<void> { this.sessions.delete(id); } }
export class RedisUssdSessionStore implements UssdSessionStore {
  public constructor(private readonly url = process.env.UPSTASH_REDIS_REST_URL, private readonly token = process.env.UPSTASH_REDIS_REST_TOKEN, private readonly fetcher: typeof fetch = fetch) {}
  private async command(parts: string[]): Promise<unknown> { if (!this.url || !this.token) throw new AppError("USSD session storage is not configured.", 503, "USSD_STORE_NOT_CONFIGURED"); const response = await this.fetcher(this.url, { method: "POST", headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" }, body: JSON.stringify(parts) }); if (!response.ok) throw new AppError("USSD session storage failed.", 502, "USSD_STORE_ERROR"); return (await response.json() as { result: unknown }).result; }
  public async get(id: string): Promise<UssdSession | null> { const result = await this.command(["GET", `ussd:session:${id}`]); return typeof result === "string" ? JSON.parse(result) as UssdSession : null; }
  public async set(session: UssdSession): Promise<void> { await this.command(["SET", `ussd:session:${session.sessionId}`, JSON.stringify(session), "EX", String(USSD_RULES.sessionTtlSeconds)]); }
  public async delete(id: string): Promise<void> { await this.command(["DEL", `ussd:session:${id}`]); }
}
