const pages = ["/", "/login", "/reset-password", "/feed", "/saved", "/settings", "/profile", "/feedback", "/opportunities", "/onboarding/organization", "/dashboard", "/dashboard/organization", "/dashboard/opportunities", "/dashboard/opportunities/new", "/dashboard/analytics", "/dashboard/monetization"];
export const ADMIN_PAGES = ["overview","users","opportunities","organizations","matching","algorithm","performance","activity","notifications","feedback","kpis","slo","review","exports","access-log"] as const;
const api = ["profile", "profile/completeness", "opportunities", "opportunities/refresh", "matches", "saved", "notifications", "notifications/run", "notifications/preferences", "organizations", "organizations/review", "reports", "reports/review", "monitoring/kpis", "monitoring/slo", "ussd/session", "ussd/credentials", "ingestion/scraping/shadow", "feedback", "telemetry/vitals", "admin-portal/unlock", "admin-portal/lock"];
const dynamic = ["/opportunity/[id]", "/api/v1/opportunities/[id]", "/api/v1/opportunities/[id]/events", "/api/v1/matches/[id]/explanation", "/api/v1/saved/[id]", "/api/v1/saved/[id]/status", "/api/v1/organizations/[id]", "/api/v1/organizations/[id]/analytics", "/api/v1/organizations/[id]/monetization", "/api/v1/organizations/review/[id]", "/api/v1/reports/review/[id]", "/api/v1/admin/feedback/[id]", "/api/v1/admin/export/[dataset]"];
export const ROUTE_TEMPLATES = [...pages,...ADMIN_PAGES.map(p=>`/admin/${p}`),...api.map(p=>`/api/v1/${p}`),...dynamic,"/unknown"];
export function routeTemplate(path: string): string {
  const pathname=path.split("?")[0]!.replace(/\/$/,"") || "/";
  if (ROUTE_TEMPLATES.includes(pathname)) return pathname;
  return dynamic.find(template => new RegExp(`^${template.replace(/\[(?:id|dataset)\]/g,"[^/]+")}$`).test(pathname)) ?? "/unknown";
}
export function deviceClass(width: number, userAgent: string): "mobile" | "tablet" | "desktop" { return width<640 || /Mobi|iPhone/i.test(userAgent) ? "mobile" : width<1024 || /iPad|Tablet/i.test(userAgent) ? "tablet" : "desktop"; }
