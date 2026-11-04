"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/logo";

const seekerLinks = [["Matches", "/feed"], ["Saved", "/saved"], ["Opportunities", "/opportunities"]] as const;
const seekerPaths = ["/feed", "/saved", "/opportunities", "/profile", "/settings", "/feedback", "/opportunity"];
const bareHeaderPaths = ["/login", "/reset-password"];

const menuItem = "flex min-h-11 w-full items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-butter focus-visible:bg-butter";

// The menu opens while the pointer is over the icon or the menu and closes as soon as it leaves,
// so there is nothing to tap a second time. Touch and keyboard users toggle it with a tap/Enter
// and it closes on an outside tap, Escape, or navigation.
function AccountMenu({ seeker, admin }: { seeker: boolean; admin: boolean }): React.JSX.Element {
  const wrapper = useRef<HTMLDivElement>(null);
  const pointerType = useRef("mouse");
  const pathname = usePathname();
  // Remember which page the menu was opened on, so navigating closes it without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean | ((previous: boolean) => boolean)): void => setOpenOn((previous) => (typeof value === "function" ? value(previous === pathname) : value) ? pathname : null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent): void => { if (!wrapper.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent): void => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (seeker && !admin) {
    const active = pathname === "/profile";
    return <Link href="/profile" aria-label="Profile" title="Profile" aria-current={active ? "page" : undefined}
      className={`flex size-11 items-center justify-center rounded-full border text-ink transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf ${active ? "border-amber bg-amber/50" : "border-ink/15 bg-white hover:bg-cream"}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></svg>
    </Link>;
  }

  return <div ref={wrapper} className="relative"
    onPointerEnter={(event) => { pointerType.current = event.pointerType; if (event.pointerType === "mouse") setOpen(true); }}
    onPointerLeave={(event) => { if (event.pointerType === "mouse") setOpen(false); }}>
    <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={admin ? "Account" : seeker ? "Profile and settings" : "Account"}
      onPointerDown={(event) => { pointerType.current = event.pointerType; }}
      onClick={(event) => { if (event.detail > 0 && pointerType.current === "mouse") { setOpen(true); return; } setOpen((value) => !value); }}
      className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-ink/15 bg-white text-ink transition hover:bg-cream">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></svg>
    </button>
    {open && <div className="absolute right-0 top-full z-50 pt-2">
      <div role="menu" className="w-48 rounded-2xl border border-ink/10 bg-white p-2 shadow-soft">
        {!admin && <Link role="menuitem" href="/feedback" className={menuItem}>Feedback</Link>}
        {seeker && !admin ? <>
          <Link role="menuitem" href="/profile" className={menuItem}>My profile</Link>
          <Link role="menuitem" href="/settings" className={menuItem}>Settings</Link>
        </> : <form action="/auth/logout" method="post"><button role="menuitem" className={menuItem}>Sign out</button></form>}
      </div>
    </div>}
  </div>;
}

function HeaderTabs(): React.JSX.Element {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="flex items-stretch gap-8">
    {seekerLinks.map(([name, href]) => {
      const active = pathname === href || pathname.startsWith(`${href}/`) || (href === "/feed" && pathname.startsWith("/opportunity/"));
      return <Link key={href} href={href} prefetch aria-current={active ? "page" : undefined} className="tab-link">{name}</Link>;
    })}
  </nav>;
}

export function SiteHeader({ signedIn }: { signedIn: boolean }): React.JSX.Element {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isSeeker = seekerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isStaff = pathname.startsWith("/dashboard") || isAdmin;
  const bare = bareHeaderPaths.includes(pathname);
  const home = isSeeker ? "/feed" : isAdmin ? "/admin/overview" : isStaff ? "/dashboard" : "/";

  return <header className={isLanding ? "relative z-30" : "sticky top-0 z-30 border-b border-ink/10 bg-white/95 backdrop-blur"}>
    <div className={`mx-auto grid ${isLanding ? "min-h-20" : "min-h-16"} max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8`}>
      <Link href={home} className="flex shrink-0 items-center gap-2 justify-self-start text-xl font-bold tracking-tight text-ink" aria-label="OppScout home"><Logo size={34} /><span className={isLanding ? "max-[380px]:sr-only" : undefined}>oppscout</span></Link>
      <div className="hidden self-stretch md:flex">{isSeeker && <HeaderTabs />}</div>
      <div className="flex items-center gap-2 justify-self-end">
        {isLanding && <>
          <Link href="/login" className="button-secondary !min-h-11 !px-3 text-sm sm:!px-5">Log in</Link>
          <Link href="/profile" className="button !min-h-11 !px-3 text-sm sm:!px-5">Get started</Link>
        </>}
        {!bare && !isLanding && (signedIn || isSeeker || isStaff) && <AccountMenu seeker={isSeeker} admin={isAdmin} />}
      </div>
    </div>
  </header>;
}
