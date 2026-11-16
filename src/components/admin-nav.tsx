"use client";

import { AppSidebar, type IconName, type SideLink } from "@/components/app-shell";
import { LockPortal } from "@/components/admin-controls";

const icons: Partial<Record<string, IconName>> = {
  overview: "overview", users: "people", opportunities: "opportunities", organizations: "organization", matching: "people",
  algorithm: "chart", performance: "chart", activity: "clock", notifications: "feedback", feedback: "feedback",
  kpis: "chart", slo: "clock", review: "shield", exports: "saved", "access-log": "shield",
};
const names: Partial<Record<string, string>> = { review: "Review queue", opportunities: "Catalogue", organizations: "Publishers", kpis: "KPIs", slo: "System health", "access-log": "Access log" };
// Day-to-day work first: what needs a decision, what is in the catalogue, who is using it.
// Analytics and system pages sit under "More"; every section still works at /admin/<section>.
const SHOW_MORE_SECTIONS = true;
const primary = ["overview", "review", "opportunities", "organizations", "users", "feedback"];

const label = (section: string): string => {
  const words = section.replace(/-/g, " ");
  return names[section] ?? `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};
const link = (section: string): SideLink => ({ label: label(section), href: `/admin/${section}`, icon: icons[section] ?? "dot" });

export function AdminNav({ sections }: { sections: readonly string[] }): React.JSX.Element {
  const main = primary.filter((section) => sections.includes(section)).map(link);
  const more = !SHOW_MORE_SECTIONS ? [] : sections.filter((section) => !primary.includes(section)).map(link);
  return <AppSidebar
    label="Portal sections"
    home="/admin/overview"
    badge={{ text: "ADMIN", dark: true }}
    groups={[{ links: main }, ...(more.length ? [{ title: "MORE", links: more }] : []), { title: "ACCOUNT", links: [] }]}
    footer={<div className="mt-2 px-3.5 text-[13px]"><LockPortal /></div>}
  />;
}
