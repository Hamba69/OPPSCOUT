import { AppError } from "@/core/errors/app-error";

export type RateLimitClient = "user" | "organization" | "admin" | "ussd";

const DEFAULT_LIMITS: Record<RateLimitClient, number> = { user: 120, organization: 240, admin: 360, ussd: 60 };

function configuredLimit(client: RateLimitClient): number {
  const value = Number(process.env[`RATE_LIMIT_${client.toUpperCase()}_PER_MINUTE`]);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_LIMITS[client];
}

export async function enforceRateLimit(client: RateLimitClient, principal: string, now = new Date()): Promise<void> {
  if (process.env.OPPSCOUT_DATA_MODE === "memory" || process.env.NODE_ENV === "test") return;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new AppError("Rate limiting is not configured.", 503, "RATE_LIMIT_NOT_CONFIGURED");
  const window = Math.floor(now.getTime() / 60_000);
  const key = `rate:${client}:${principal}:${window}`;
  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify([["INCR", key], ["EXPIRE", key, "120", "NX"]]),
  });
  if (!response.ok) throw new AppError("Rate limiting storage failed.", 502, "RATE_LIMIT_STORE_ERROR");
  const result = await response.json() as Array<{ result: unknown }>;
  const count = Number(result[0]?.result);
  if (!Number.isFinite(count)) throw new AppError("Rate limiting storage returned an invalid response.", 502, "RATE_LIMIT_STORE_ERROR");
  if (count > configuredLimit(client)) throw new AppError("Too many requests. Please retry shortly.", 429, "RATE_LIMITED", { retryAfterSeconds: 60 });
}
