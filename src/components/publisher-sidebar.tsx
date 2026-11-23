"use client";

import { DrawerFrame, type SideGroup } from "@/components/app-shell";

/**
 * The publisher menu, in the same shape as the seeker menu: a sidebar on wide screens, a Menu drawer on
 * phones. Switching to finding opportunities lives on the publisher profile page, not here.
 */
const publisherGroups: SideGroup[] = [
  { title: "PUBLISH", links: [
    { label: "Post an opportunity", href: "/dashboard/new", icon: "plus" },
    { label: "My postings", href: "/dashboard", icon: "opportunities" },
  ] },
  { title: "ACCOUNT", links: [
    { label: "Publisher profile", href: "/dashboard/profile", icon: "profile" },
  ] },
];

export function PublisherFrame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <DrawerFrame id="publisher-sidebar" label="Publisher navigation" home="/dashboard" groups={publisherGroups}>{children}</DrawerFrame>;
}
