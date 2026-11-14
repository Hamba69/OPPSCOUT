"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/logo";

/** Stroke icons used in the sidebars, tiles and cards. Paths are 24×24. */
export const ICON_PATHS = {
  matches: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  saved: "M6 3h12v18l-6-4-6 4z",
  opportunities: "M3 7h18v13H3zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18",
  profile: "M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c1-5 15-5 16 0",
  feedback: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  signOut: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  overview: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  people: "M9 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM2 20c.8-4.5 13.2-4.5 14 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .6 3.5 2.6 4 6",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  organization: "M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  dot: "M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  job: "M3 8h18v12H3zM9 8V5h6v3M3 13h18",
  scholarship: "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5",
  internship: "M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM5 21c1-5 13-5 14 0",
  grant: "M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM6 10v4M18 10v4",
  chevron: "M9 6l6 6-6 6",
  back: "M15 18l-6-6 6-6",
  search: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-3.5-3.5",
  clock: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v5l3 2",
  check: "M5 12l5 5L20 7",
  plus: "M12 5v14M5 12h14",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function Icon({ name, size = 16, className, strokeWidth = 2 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }): React.JSX.Element {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><path d={ICON_PATHS[name]} /></svg>;
}

export type SideLink = { label: string; href: string; icon: IconName; match?: string[] };
export type SideGroup = { title?: string; ariaLabel?: string; links: SideLink[] };

function isActive(pathname: string, link: SideLink): boolean {
  const paths = [link.href, ...(link.match ?? [])];
  return paths.some((path) => pathname === path || (path !== "/dashboard" && pathname.startsWith(`${path}/`)));
}

/** Sidebar used by every signed-in area. On phones it becomes a scrollable strip (or is hidden when bottom tabs take over). */
export function AppSidebar({ label, home, badge, groups, signOut = true, phone = "strip", footer }: {
  label: string; home: string; badge?: { text: string; dark?: boolean }; groups: SideGroup[];
  signOut?: boolean; phone?: "strip" | "hidden"; footer?: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  return <aside className={`app-sidebar ${phone === "hidden" ? "max-md:hidden" : "app-sidebar-scroll"}`}>
    <Link href={home} className="app-brand" aria-label="OppScout home"><Logo size={32} />oppscout</Link>
    {badge && <span className={`app-badge ${badge.dark ? "app-badge-dark" : ""}`}>{badge.text}</span>}
    {groups.map((group, index) => <div key={group.title ?? index} className="contents">
      {group.title && <p className={`app-group ${index === 0 ? "!mt-0" : ""}`} aria-hidden="true">{group.title}</p>}
      <nav aria-label={group.ariaLabel ?? (group.title ? `${group.title.charAt(0)}${group.title.slice(1).toLowerCase()}` : label)} className="flex flex-col gap-0.5">
        {group.links.map((link) => <Link key={link.href} href={link.href} prefetch aria-current={isActive(pathname, link) ? "page" : undefined} className="side-link">
          <Icon name={link.icon} />{link.label}
        </Link>)}
        {signOut && index === groups.length - 1 && <form action="/auth/logout" method="post" className="contents">
          <button type="submit" className="side-link"><Icon name="signOut" />Sign out</button>
        </form>}
      </nav>
    </div>)}
    {footer}
  </aside>;
}

/** Glass container with a sidebar on the left and the page on the right. */
export function AppFrame({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }): React.JSX.Element {
  return <div className="app-frame">
    <div className="app-frame-inner">
      {sidebar}
      <div className="app-frame-main">{children}</div>
    </div>
  </div>;
}

export const SEEKER_PATHS = ["/feed", "/saved", "/opportunities", "/opportunity", "/profile", "/settings", "/feedback"];

const seekerGroups: SideGroup[] = [
  { title: "DISCOVER", links: [
    { label: "Matches", href: "/feed", icon: "matches", match: ["/opportunity"] },
    { label: "Saved", href: "/saved", icon: "saved" },
    { label: "Opportunities", href: "/opportunities", icon: "opportunities" },
  ] },
  { title: "ACCOUNT", links: [
    { label: "My profile", href: "/profile", icon: "profile", match: ["/settings"] },
    { label: "Feedback", href: "/feedback", icon: "feedback" },
  ] },
];

/** Wraps seeker pages in the sidebar frame; every other page renders as it is. */
export function SeekerFrame({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const seeker = SEEKER_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!seeker) return <>{children}</>;
  return <AppFrame sidebar={<AppSidebar label="Main navigation" home="/feed" groups={seekerGroups} phone="hidden" />}>{children}</AppFrame>;
}
