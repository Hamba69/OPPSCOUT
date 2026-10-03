import { routeTemplate } from "@/lib/route-template";
import { ZodError } from "zod";

import { AppError } from "@/core/errors/app-error";
import { recordApiSample } from "@/services/monitoring/metrics";

export interface ApiSuccess<T> {
  data: T;
  meta: { freshnessAt: string };
}

export function success<T>(data: T, status = 200, freshnessAt = new Date()): Response {
  return Response.json({ data, meta: { freshnessAt: freshnessAt.toISOString() } } satisfies ApiSuccess<T>, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function apiHandler(request: Request, handler: () => Promise<Response>): Promise<Response> {
  const startedAt = performance.now();
  return handler()
    .then((response) => {
      recordApiSample({ kind: "api", route: routeTemplate(new URL(request.url).pathname), method: request.method, status: response.status, ok: response.status < 500, durationMs: Math.round(performance.now() - startedAt) });
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    })
    .catch((error: unknown) => {
      const status = error instanceof AppError ? error.status : error instanceof ZodError ? 400 : 500;
      recordApiSample({ kind: "api", route: routeTemplate(new URL(request.url).pathname), method: request.method, status, ok: status < 500, durationMs: Math.round(performance.now() - startedAt) });
      if (error instanceof AppError) {
        const headers = error.status === 429 ? { "Retry-After": String((error.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds ?? 60) } : undefined;
        return Response.json({ error: { code: error.code, message: error.message, details: error.details ?? null } }, { status: error.status, headers });
      }
      if (error instanceof ZodError) {
        return Response.json({ error: { code: "VALIDATION_ERROR", message: "Request validation failed.", details: error.flatten() } }, { status: 400 });
      }
      console.error("API request failed.", { route: routeTemplate(new URL(request.url).pathname), status });
      return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }, { status: 500 });
    });
}
