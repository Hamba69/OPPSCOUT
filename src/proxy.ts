import { type NextRequest, NextResponse } from "next/server";

import { CONFIRM_AGE_PATH, isConfirmedAdult } from "@/lib/adult";
import { refreshSession } from "@/lib/supabase/proxy";

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const session = await refreshSession(request);
  if (!session.configured) return NextResponse.redirect(new URL("/login?error=configuration", request.url));
  if (!session.user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  // Adults only: until the account holds a date of birth showing 18 or older, every app page leads to the
  // one-time age confirmation. This covers accounts made before sign-up asked for a date of birth.
  if (!isConfirmedAdult(session.user)) {
    const confirm = new URL(CONFIRM_AGE_PATH, request.url);
    confirm.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(confirm);
  }
  return session.response;
}

export const config = {
  matcher: [
    "/feed/:path*",
    "/profile/:path*",
    "/saved/:path*",
    "/settings/:path*",
    "/opportunity/:path*",
    "/opportunities/:path*",
    "/dashboard/:path*",
  ],
};
