import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<Response> {
  try { await (await createClient()).auth.signOut(); }
  catch { /* A missing local configuration is already handled by the login page. */ }
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
