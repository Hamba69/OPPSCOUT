import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requested = requestUrl.searchParams.get("next");
  const nextPath = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/feed";
  if (!code) return NextResponse.redirect(new URL("/login?error=callback", request.url));
  let client;
  try { client = await createClient(); }
  catch { return NextResponse.redirect(new URL("/login?error=configuration", request.url)); }
  const { error } = await client.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? "/login?error=callback" : nextPath, request.url));
}
