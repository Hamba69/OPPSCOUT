import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<Response> {
  try { await (await createClient()).auth.signOut(); }
  catch { /* A missing local configuration is already handled by the login page. */ }
  const form = await request.formData().catch(() => null);
  const requested = form?.get("next");
  const target = typeof requested === "string" && requested.startsWith("/organizations/") ? requested : "/login";
  return NextResponse.redirect(new URL(target, request.url), { status: 303 });
}
