import type { NextConfig } from "next";

const scriptPolicy = process.env.NODE_ENV === "development"
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
  // The publisher area is retired: anyone signed in posts from /post and manages listings at /my-postings.
  // Old links and bookmarks land on the new pages. Existing organisations and listings are kept.
  async redirects() {
    return [
      { source: "/organizations", destination: "/post", permanent: false },
      { source: "/organizations/login", destination: "/login?next=%2Fmy-postings", permanent: false },
      { source: "/organizations/signup", destination: "/login?mode=signup&next=%2Fpost", permanent: false },
      { source: "/onboarding/organization", destination: "/post", permanent: false },
      { source: "/dashboard/opportunities/new", destination: "/post", permanent: false },
      { source: "/dashboard/opportunities/:id/edit", destination: "/my-postings/:id/edit", permanent: false },
      { source: "/dashboard", destination: "/my-postings", permanent: false },
      { source: "/dashboard/:path*", destination: "/my-postings", permanent: false },
    ];
  },
  async headers() {
    return [
      ...["/admin/:path*", "/api/v1/admin/:path*", "/api/v1/admin-portal/:path*", "/api/v1/monitoring/:path*", "/api/v1/reports/review/:path*", "/api/v1/organizations/review/:path*"].map(source => ({ source, headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] })),
      {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; ${scriptPolicy}; connect-src 'self' https://*.supabase.co; upgrade-insecure-requests` },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      ],
    }];
  },
};

export default nextConfig;
