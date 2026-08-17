import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { AppError, ForbiddenError } from "@/core/errors/app-error";
import { isMemoryDataMode } from "@/lib/repository";
import { DEMO_ADMIN_ID, DEMO_ORG_ID, DEMO_ORG_USER_ID, DEMO_USER_ID } from "@/lib/repository/memory";

export type AppRole = "user" | "organization" | "admin";

export interface AuthContext {
  userId: string;
  role: AppRole;
  organizationId: string | null;
}

function demoAuth(request: Request): AuthContext {
  const requestedRole = request.headers.get("x-oppscout-demo-role");
  if (requestedRole === "admin") return { userId: DEMO_ADMIN_ID, role: "admin", organizationId: null };
  if (requestedRole === "organization") return { userId: DEMO_ORG_USER_ID, role: "organization", organizationId: DEMO_ORG_ID };
  return { userId: process.env.OPPSCOUT_DEMO_USER_ID || DEMO_USER_ID, role: "user", organizationId: null };
}

function demoAuthForRole(role: AppRole): AuthContext {
  if (role === "admin") return { userId: DEMO_ADMIN_ID, role, organizationId: null };
  if (role === "organization") return { userId: DEMO_ORG_USER_ID, role, organizationId: DEMO_ORG_ID };
  return { userId: process.env.OPPSCOUT_DEMO_USER_ID || DEMO_USER_ID, role, organizationId: null };
}

function contextFromUser(user: { id: string; app_metadata: Record<string, unknown> }): AuthContext {
  const roleValue = user.app_metadata.role;
  const role: AppRole = roleValue === "admin" || roleValue === "organization" ? roleValue : "user";
  const organizationId = typeof user.app_metadata.organization_id === "string" ? user.app_metadata.organization_id : null;
  return { userId: user.id, role, organizationId };
}

export async function requireAuth(request: Request): Promise<AuthContext> {
  if (isMemoryDataMode()) return demoAuth(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new AppError("Authentication is not configured.", 503, "AUTH_NOT_CONFIGURED");

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const authClient = bearer
    ? createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${bearer}` } }, auth: { persistSession: false } })
    : createServerClient(url, anonKey, {
        cookies: {
          getAll: async () => (await cookies()).getAll(),
          setAll: async (values) => {
            const store = await cookies();
            for (const { name, value, options } of values) store.set(name, value, options);
          },
        },
      });
  const { data, error } = await authClient.auth.getUser(bearer);
  if (error || !data.user) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
  return contextFromUser(data.user);
}

export function requireRole(auth: AuthContext, roles: AppRole[]): void {
  if (!roles.includes(auth.role)) throw new ForbiddenError();
}

export async function requirePageAuth(roles: AppRole[] = ["user"]): Promise<AuthContext> {
  if (isMemoryDataMode()) return demoAuthForRole(roles[0] ?? "user");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new AppError("Authentication is not configured.", 503, "AUTH_NOT_CONFIGURED");
  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll: async () => (await cookies()).getAll(),
      setAll: async (values) => {
        const store = await cookies();
        for (const { name, value, options } of values) store.set(name, value, options);
      },
    },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new AppError("Authentication is required.", 401, "UNAUTHENTICATED");
  const context = contextFromUser(data.user);
  requireRole(context, roles);
  return context;
}
