import "server-only";

import { AppError, ForbiddenError } from "@/core/errors/app-error";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createBearerClient, createClient } from "@/lib/supabase/server";

export type AppRole = "user" | "organization" | "admin";

export interface AuthContext {
  userId: string;
  role: AppRole;
  organizationId: string | null;
}

async function contextFromUser(user: { id: string; app_metadata: Record<string, unknown> }): Promise<AuthContext> {
  const roleValue = user.app_metadata.role;
  const role: AppRole = roleValue === "admin" || roleValue === "organization" ? roleValue : "user";
  const organizationId = typeof user.app_metadata.organization_id === "string" ? user.app_metadata.organization_id : null;
  if (role === "organization" && organizationId) return { userId: user.id, role, organizationId };
  if (role === "admin") return { userId: user.id, role, organizationId: null };
  const organization = (await (await import("@/lib/repository")).getRepository()).listOrganizations()
    .then((items) => items.find((item) => item.dashboardUsers.includes(user.id)));
  const owned = await organization;
  return owned ? { userId: user.id, role: "organization", organizationId: owned.id } : { userId: user.id, role: "user", organizationId: null };
}

export async function requireAuth(request: Request): Promise<AuthContext> {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  let authClient;
  try { authClient = bearer ? createBearerClient(bearer) : await createClient(); }
  catch { throw new AppError("Authentication is not configured.", 503, "AUTH_NOT_CONFIGURED"); }
  const { data, error } = await authClient.auth.getUser(bearer);
  if (error || !data.user) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
  const context = await contextFromUser(data.user);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  await enforceRateLimit(context.role, `${context.userId}:${forwarded ?? "unknown"}`);
  return context;
}

export function requireRole(auth: AuthContext, roles: AppRole[]): void {
  if (!roles.includes(auth.role)) throw new ForbiddenError();
}

export async function requirePageAuth(roles: AppRole[] = ["user"]): Promise<AuthContext> {
  let client;
  try { client = await createClient(); }
  catch { throw new AppError("Authentication is not configured.", 503, "AUTH_NOT_CONFIGURED"); }
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
  const context = await contextFromUser(data.user);
  requireRole(context, roles);
  return context;
}
