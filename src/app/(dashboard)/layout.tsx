import { SectionNav } from "@/components/section-nav";

export default function ProviderLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <><div className="page-shell pb-0 pt-4"><SectionNav label="Provider tools" links={[["Overview", "/dashboard"], ["Opportunities", "/dashboard/opportunities"], ["Analytics", "/dashboard/analytics"], ["Organization", "/dashboard/organization"], ["Readiness", "/dashboard/monetization"]]} /></div>{children}</>;
}
