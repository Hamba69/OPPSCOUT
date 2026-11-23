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
  // Posting lives in the publisher area at /dashboard; anyone signed in can use it, no organisation needed.
  // Old publisher pages and the short-lived /post and /my-postings addresses land on their new homes.
  async redirects() {
    return [
      { source: "/organizations", destination: "/dashboard/new", permanent: false },
      { source: "/organizations/login", destination: "/login?next=%2Fdashboard", permanent: false },
      { source: "/organizations/signup", destination: "/login?mode=signup&next=%2Fdashboard%2Fnew", permanent: false },
      { source: "/onboarding/organization", destination: "/dashboard/new", permanent: false },
      { source: "/post", destination: "/dashboard/new", permanent: false },
      { source: "/my-postings", destination: "/dashboard", permanent: false },
      { source: "/my-postings/:id/edit", destination: "/dashboard/:id/edit", permanent: false },
      { source: "/dashboard/opportunities/new", destination: "/dashboard/new", permanent: false },
      { source: "/dashboard/opportunities/:id/edit", destination: "/dashboard/:id/edit", permanent: false },
      { source: "/dashboard/opportunities", destination: "/dashboard", permanent: false },
      { source: "/dashboard/organization", destination: "/dashboard", permanent: false },
      { source: "/dashboard/analytics", destination: "/dashboard", permanent: false },
      { source: "/dashboard/monetization", destination: "/dashboard", permanent: false },
      { source: "/dashboard/candidates/:path*", destination: "/dashboard", permanent: false },
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
