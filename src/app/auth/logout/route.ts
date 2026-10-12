import { NextResponse } from "next/server";

import { portalCookieName, portalCookieOptions } from "@/lib/admin-portal";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<Response> {
  try { await (await createClient()).auth.signOut(); }
  catch { /* A missing local configuration is already handled by the login page. */ }
  const form = await request.formData().catch(() => null);
  const requested = form?.get("next");
  const target = typeof requested === "string" && requested.startsWith("/organizations/") ? requested : "/login";
  const response = NextResponse.redirect(new URL(target, request.url), { status: 303 });
  // Signing out also locks the admin portal.
  response.cookies.set(portalCookieName(), "", { ...portalCookieOptions(), maxAge: 0 });
  return response;
}
