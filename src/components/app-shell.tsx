"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/logo";

import { Icon, type IconName } from "@/components/custom-icon";
export { Icon, type IconName } from "@/components/custom-icon";

export type SideLink = { label: string; href: string; icon: IconName; match?: string[] };
export type SideGroup = { title?: string; ariaLabel?: string; links: SideLink[] };

function isActive(pathname: string, link: SideLink): boolean {
  const paths = [link.href, ...(link.match ?? [])];
  // "/dashboard" is My postings: it covers editing a posting, but not the other publisher pages below it.
  if (link.href === "/dashboard") return pathname === "/dashboard" || /^\/dashboard\/[^/]+\/edit$/.test(pathname);
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Sidebar used by every signed-in area. */
export function AppSidebar({ id, label, home, badge, groups, signOut = true, phone = "strip", footer, mobileOpen = false, onMobileClose }: {
  id?: string;
  label: string; home: string; badge?: { text: string; dark?: boolean }; groups: SideGroup[];
  signOut?: boolean; phone?: "strip" | "hidden" | "drawer"; footer?: React.ReactNode;
  mobileOpen?: boolean; onMobileClose?: () => void;
}): React.JSX.Element {
  const pathname = usePathname();
  return <aside
    id={id}
    className={`app-sidebar ${phone === "hidden" ? "max-md:hidden" : phone === "drawer" ? `seeker-sidebar-drawer ${mobileOpen ? "is-open" : ""}` : "app-sidebar-scroll"}`}
    role={phone === "drawer" && mobileOpen ? "dialog" : undefined}
    aria-modal={phone === "drawer" && mobileOpen ? true : undefined}
    aria-label={phone === "drawer" && mobileOpen ? label : undefined}
  >
    <Link href={home} className="app-brand" aria-label="OppScout home"><Logo size={32} />oppscout</Link>
    {badge && <span className={`app-badge ${badge.dark ? "app-badge-dark" : ""}`}>{badge.text}</span>}
    {groups.map((group, index) => <div key={group.title ?? index} className="contents">
      {group.title && <p className={`app-group ${index === 0 ? "!mt-0" : ""}`} aria-hidden="true">{group.title}</p>}
      <nav aria-label={group.ariaLabel ?? (group.title ? `${group.title.charAt(0)}${group.title.slice(1).toLowerCase()}` : label)} className="flex flex-col gap-0.5">
        {group.links.map((link) => <Link key={link.href} href={link.href} prefetch onClick={phone === "drawer" ? onMobileClose : undefined} aria-current={isActive(pathname, link) ? "page" : undefined} className="side-link">
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

/**
 * The signed-in menu: a sidebar on wide screens and a "Menu" drawer on phones. The seeker app and the
 * publisher area both use it, each with their own links, so they look and work the same.
 */
export function DrawerFrame({ id, label, home, groups, children }: { id: string; label: string; home: string; groups: SideGroup[]; children: React.ReactNode }): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const focusableSelector = `#${id} a[href], #${id} button:not([disabled])`;
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButton.current?.focus();
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement as HTMLElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement as HTMLElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.querySelector<HTMLElement>(focusableSelector)?.focus();
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen, id]);

  const closeMobileNav = (): void => {
    setMobileOpen(false);
    menuButton.current?.focus();
  };
  return <>
    <div className="seeker-mobile-nav md:hidden">
      <button ref={menuButton} type="button" aria-expanded={mobileOpen} aria-controls={id} onClick={() => setMobileOpen((open) => !open)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink glass-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf">
        <Icon name="menu" size={18} />
        Menu
      </button>
    </div>
    {mobileOpen && <button type="button" className="seeker-sidebar-backdrop md:hidden" aria-label="Close navigation" onClick={closeMobileNav} />}
    <AppFrame sidebar={<AppSidebar id={id} label={label} home={home} groups={groups} phone="drawer" mobileOpen={mobileOpen} onMobileClose={closeMobileNav} />}>{children}</AppFrame>
  </>;
}

/** Wraps seeker pages in the drawer menu; every other page renders as it is. */
export function SeekerFrame({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const seeker = SEEKER_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!seeker) return <>{children}</>;
  return <DrawerFrame id="seeker-sidebar" label="Main navigation" home="/feed" groups={seekerGroups}>{children}</DrawerFrame>;
}
