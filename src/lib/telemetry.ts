import "server-only";
import { after } from "next/server";

/** The task is registered before the response, and errors never reach the request. */
export function deferTelemetry(task: () => Promise<void>): void {
  const safe = async () => { try { await task(); } catch { console.error("Telemetry write dropped."); } };
  try { after(safe); } catch { void safe(); }
}
