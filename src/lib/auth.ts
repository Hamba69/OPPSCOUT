import "server-only";

import { cache } from "react";
import { AppError, ForbiddenError } from "@/core/errors/app-error";
import { findOrganizationIdForDashboardUser } from "@/lib/profile-store";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createBearerClient, createClient } from "@/lib/supabase/server";

export type AppRole = "user" | "organization" | "admin";

export interface AuthContext {
  userId: string;
  role: AppRole;
  organizationId: string | null;
}

const getPageUser = cache(async () => {
  let authClient;
  try {
    authClient = await createClient();
  } catch {
    return { user: null, configured: false } as const;
  }
  const { data, error } = await authClient.auth.getUser();
  return { user: error ? null : data.user, configured: true } as const;
});

async function contextFromUser(user: { id: string; app_metadata: Record<string, unknown> }): Promise<AuthContext> {
  const roleValue = user.app_metadata.role;
  const role: AppRole = roleValue === "admin" || roleValue === "organization" ? roleValue : "user";
  const organizationId = typeof user.app_metadata.organization_id === "string" ? user.app_metadata.organization_id : null;
  if (role === "organization" && organizationId) return { userId: user.id, role, organizationId };
  if (role === "admin") return { userId: user.id, role, organizationId: null };
  const ownedOrganizationId = await findOrganizationIdForDashboardUser(user.id);
  return ownedOrganizationId
    ? { userId: user.id, role: "organization", organizationId: ownedOrganizationId }
    : { userId: user.id, role: "user", organizationId: null };
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
  const result = await getPageContext();
  if (!result.configured) throw new AppError("Authentication is not configured.", 503, "AUTH_NOT_CONFIGURED");
  if (!result.context) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
  const context = result.context;
  requireRole(context, roles);
  return context;
}

export function homePathForRole(role: AppRole): string {
  return role === "organization" ? "/dashboard" : "/feed";
}

/** Returns the signed-in user's context, or null for visitors. Never throws for signed-out visitors. */
export async function getOptionalAuth(): Promise<AuthContext | null> {
  try { return (await getPageContext()).context; }
  catch { return null; }
}

const getPageContext = cache(async () => {
  const result = await getPageUser();
  if (!result.configured || !result.user) return { context: null, configured: result.configured } as const;
  return { context: await contextFromUser(result.user), configured: true } as const;
});

export async function hasPageSession(): Promise<boolean> {
  return Boolean((await getPageUser()).user);
}
