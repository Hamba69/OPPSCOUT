import { type NextRequest, NextResponse } from "next/server";

import { refreshSession } from "@/lib/supabase/proxy";

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  if (process.env.OPPSCOUT_DATA_MODE === "memory") return NextResponse.next();
  const session = await refreshSession(request);
  if (!session.configured) return NextResponse.redirect(new URL("/login?error=configuration", request.url));
  if (!session.user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  return session.response;
}

export const config = {
  matcher: ["/feed/:path*", "/profile/:path*", "/saved/:path*", "/settings/:path*", "/opportunity/:path*", "/dashboard/:path*", "/admin/:path*", "/onboarding/:path*"],
};
