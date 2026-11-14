import { type NextRequest, NextResponse } from "next/server";

import { FEATURE_FLAGS } from "@/config/feature-flags";
import { refreshSession } from "@/lib/supabase/proxy";

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const session = await refreshSession(request);
  if (!session.configured) return NextResponse.redirect(new URL("/login?error=configuration", request.url));
  if (!session.user) {
    const path = request.nextUrl.pathname;
    const organizationArea = path === "/dashboard" || path.startsWith("/dashboard/") || path.startsWith("/onboarding/organization");
    const login = new URL(organizationArea ? "/organizations/login" : "/login", request.url);
    login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  const path = request.nextUrl.pathname;
  const hiddenFromPublishers = path === "/dashboard/monetization"
    || (!FEATURE_FLAGS.publisherAnalytics && path === "/dashboard/analytics")
    || (!FEATURE_FLAGS.publisherMatches && (path === "/dashboard/candidates" || path.startsWith("/dashboard/candidates/")));
  if (hiddenFromPublishers) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
    "/onboarding/:path*",
  ],
};
