import { SectionNav } from "@/components/section-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <><div className="page-shell pb-0 pt-4"><SectionNav label="Admin tools" links={[["Product KPIs", "/admin/kpis"], ["Trust review", "/admin/review"], ["System health", "/admin/slo"]]} /></div>{children}</>;
}
