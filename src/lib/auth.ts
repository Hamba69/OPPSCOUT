import "server-only";

import { cache } from "react";
import { AppError, ForbiddenError } from "@/core/errors/app-error";
import { accountBirthDate, isConfirmedAdult } from "@/lib/adult";
import { findOrganizationIdForDashboardUser } from "@/lib/profile-store";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createBearerClient, createClient } from "@/lib/supabase/server";

export type AppRole = "user" | "organization" | "admin";

export interface AuthContext {
  userId: string;
  role: AppRole;
  organizationId: string | null;
  /** Whether the account holds a date of birth showing 18 or older (always true for reviewers). */
  adult: boolean;
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

async function contextFromUser(user: { id: string; app_metadata: Record<string, unknown>; user_metadata?: Record<string, unknown> }): Promise<AuthContext> {
  const adult = isConfirmedAdult(user);
  const roleValue = user.app_metadata.role;
  const role: AppRole = roleValue === "admin" || roleValue === "organization" ? roleValue : "user";
  const organizationId = typeof user.app_metadata.organization_id === "string" ? user.app_metadata.organization_id : null;
  if (role === "organization" && organizationId) return { userId: user.id, role, organizationId, adult };
  if (role === "admin") return { userId: user.id, role, organizationId: null, adult };
  const ownedOrganizationId = await findOrganizationIdForDashboardUser(user.id);
  return ownedOrganizationId
    ? { userId: user.id, role: "organization", organizationId: ownedOrganizationId, adult }
    : { userId: user.id, role: "user", organizationId: null, adult };
}

/**
 * The signed-in caller of an API route. OppScout is adults only, so a caller without a confirmed 18+ date of
 * birth is refused, except on the few routes that let them confirm it or manage their account
 * (`allowUnconfirmedAge`): their profile, alert settings, data export and account deletion.
 */
export async function requireAuth(request: Request, { allowUnconfirmedAge = false }: { allowUnconfirmedAge?: boolean } = {}): Promise<AuthContext> {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  let authClient;
  try { authClient = bearer ? createBearerClient(bearer) : await createClient(); }
  catch { throw new AppError("Authentication is not configured.", 503, "AUTH_NOT_CONFIGURED"); }
  const { data, error } = await authClient.auth.getUser(bearer);
  if (error || !data.user) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
  const context = await contextFromUser(data.user);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  await enforceRateLimit(context.role, `${context.userId}:${forwarded ?? "unknown"}`);
  if (!context.adult && !allowUnconfirmedAge) throw new AppError("OppScout is for adults aged 18 and over. Confirm your date of birth to continue.", 403, "AGE_NOT_CONFIRMED");
  return context;
}

export function requireRole(auth: AuthContext, roles: AppRole[]): void {
  if (roles.includes(auth.role) || (auth.role === "organization" && roles.includes("user"))) return;
  throw new ForbiddenError();
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
  // People who held publisher access land in the publisher area, where they manage their postings.
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

/** The signed-in person's account email, for prefilling forms. Null when signed out. */
export async function getPageUserEmail(): Promise<string | null> {
  return (await getPageUser()).user?.email ?? null;
}

/** The date of birth on the signed-in account (YYYY-MM-DD), for prefilling forms. Null when absent. */
export async function getPageUserBirthDate(): Promise<string | null> {
  return accountBirthDate((await getPageUser()).user);
}

export async function hasPageSession(): Promise<boolean> {
  return Boolean((await getPageUser()).user);
}
