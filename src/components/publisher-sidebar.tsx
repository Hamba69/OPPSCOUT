"use client";

import { AppSidebar, type SideLink } from "@/components/app-shell";
import { FEATURE_FLAGS } from "@/config/feature-flags";

// Matches and Analytics stay in the code but are hidden from publishers until their flags are turned on.
const workspace: SideLink[] = [
  { label: "Overview", href: "/dashboard", icon: "overview" },
  { label: "Opportunities", href: "/dashboard/opportunities", icon: "opportunities" },
  ...(FEATURE_FLAGS.publisherMatches ? [{ label: "Matches", href: "/dashboard/candidates", icon: "people" } as const] : []),
  ...(FEATURE_FLAGS.publisherAnalytics ? [{ label: "Analytics", href: "/dashboard/analytics", icon: "chart" } as const] : []),
];

export function PublisherSidebar(): React.JSX.Element {
  return <AppSidebar
    label="Publisher dashboard"
    home="/dashboard"
    badge={{ text: "PUBLISHER" }}
    groups={[
      { title: "WORKSPACE", links: workspace },
      { title: "ORGANIZATION", ariaLabel: "Publisher dashboard", links: [{ label: "Publisher profile", href: "/dashboard/organization", icon: "organization" }] },
    ]}
  />;
}
