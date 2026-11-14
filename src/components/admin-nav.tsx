"use client";

import { AppSidebar, type IconName } from "@/components/app-shell";
import { LockPortal } from "@/components/admin-controls";

const icons: Partial<Record<string, IconName>> = {
  overview: "overview", users: "people", opportunities: "opportunities", organizations: "organization", matching: "people",
  algorithm: "chart", performance: "chart", activity: "clock", notifications: "feedback", feedback: "feedback",
  kpis: "chart", slo: "clock", review: "shield", exports: "saved", "access-log": "shield",
};

const label = (section: string): string => {
  const words = section.replace(/-/g, " ");
  return section === "kpis" ? "KPIs" : section === "slo" ? "SLO" : `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};

export function AdminNav({ sections }: { sections: readonly string[] }): React.JSX.Element {
  return <AppSidebar
    label="Portal sections"
    home="/admin/overview"
    badge={{ text: "ADMIN", dark: true }}
    groups={[{ title: "PORTAL", links: sections.map((section) => ({ label: label(section), href: `/admin/${section}`, icon: icons[section] ?? "dot" })) }]}
    footer={<div className="mt-3 px-3.5"><LockPortal /></div>}
  />;
}
