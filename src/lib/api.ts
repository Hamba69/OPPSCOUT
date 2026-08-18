import { ZodError } from "zod";

import { AppError } from "@/core/errors/app-error";
import { recordApiSample } from "@/services/monitoring/metrics";

export interface ApiSuccess<T> {
  data: T;
  meta: { freshnessAt: string };
}

export function success<T>(data: T, status = 200, freshnessAt = new Date()): Response {
  return Response.json({ data, meta: { freshnessAt: freshnessAt.toISOString() } } satisfies ApiSuccess<T>, { status });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function apiHandler(handler: () => Promise<Response>): Promise<Response> {
  const startedAt = performance.now();
  return handler()
    .then((response) => {
      recordApiSample(response.status < 500, performance.now() - startedAt);
      return response;
    })
    .catch((error: unknown) => {
      recordApiSample(false, performance.now() - startedAt);
      if (error instanceof AppError) {
        const headers = error.status === 429 ? { "Retry-After": String((error.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds ?? 60) } : undefined;
        return Response.json({ error: { code: error.code, message: error.message, details: error.details ?? null } }, { status: error.status, headers });
      }
      if (error instanceof ZodError) {
        return Response.json({ error: { code: "VALIDATION_ERROR", message: "Request validation failed.", details: error.flatten() } }, { status: 400 });
      }
      console.error(error);
      return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }, { status: 500 });
    });
}
