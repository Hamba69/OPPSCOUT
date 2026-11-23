"use client";

import { AppSidebar } from "@/components/app-shell";

/** Publisher menu. Few enough links to show all of them on a phone, so Sign out is never scrolled away. */
export function PublisherSidebar(): React.JSX.Element {
  return <AppSidebar
    label="Publisher menu"
    home="/dashboard"
    badge={{ text: "PUBLISHER" }}
    phone="wrap"
    groups={[
      { title: "PUBLISH", links: [
        { label: "My postings", href: "/dashboard", icon: "opportunities" },
        { label: "Post an opportunity", href: "/dashboard/new", icon: "plus" },
      ] },
      { title: "OPPSCOUT", links: [{ label: "Find opportunities", href: "/feed", icon: "matches" }] },
    ]}
  />;
}
