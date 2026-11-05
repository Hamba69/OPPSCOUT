import { NextResponse } from "next/server";

import { portalCookieName, portalCookieOptions } from "@/lib/admin-portal";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<Response> {
  try { await (await createClient()).auth.signOut(); }
  catch { /* A missing local configuration is already handled by the login page. */ }
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  // Signing out also locks the admin portal.
  response.cookies.set(portalCookieName(), "", { ...portalCookieOptions(), maxAge: 0 });
  return response;
}
