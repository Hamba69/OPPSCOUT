/**
 * Any /api address with no handler. More specific routes always win, so this only answers what would
 * otherwise fall through to the HTML 404 page. API clients get the same JSON error shape as every other
 * route (see lib/api.ts).
 */
function notFound(): Response {
  return Response.json(
    { error: { code: "NOT_FOUND", message: "No API endpoint at this address.", details: null } },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const HEAD = notFound;
export const OPTIONS = notFound;
