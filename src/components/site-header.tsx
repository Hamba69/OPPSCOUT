"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/logo";
import { SectionNav } from "@/components/section-nav";

const seekerLinks = [["Matches", "/feed"], ["Saved", "/saved"], ["Opportunities", "/opportunities"]] as const;
const seekerPaths = ["/feed", "/saved", "/opportunities", "/profile", "/settings", "/opportunity"];
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

  return <div ref={wrapper} className="relative"
    onPointerEnter={(event) => { pointerType.current = event.pointerType; if (event.pointerType === "mouse") setOpen(true); }}
    onPointerLeave={(event) => { if (event.pointerType === "mouse") setOpen(false); }}>
    <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={admin ? "Account" : seeker ? "Profile and settings" : "Account"}
      onPointerDown={(event) => { pointerType.current = event.pointerType; }}
      onClick={(event) => { if (event.detail > 0 && pointerType.current === "mouse") { setOpen(true); return; } setOpen((value) => !value); }}
      className="flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-honey bg-butter text-ink">
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

export function SiteHeader({ signedIn }: { signedIn: boolean }): React.JSX.Element {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isSeeker = seekerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isStaff = pathname.startsWith("/dashboard") || isAdmin;
  const bare = bareHeaderPaths.includes(pathname);
  const home = isSeeker ? "/feed" : isAdmin ? "/admin/overview" : isStaff ? "/dashboard" : "/";

  return <header className="sticky top-0 z-30 border-b border-ink/[.06] bg-cream/95 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
      <Link href={home} className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight text-ink" aria-label="OppScout home"><Logo size={34} />oppscout</Link>
      {isSeeker && <div className="hidden md:block"><SectionNav label="Main navigation" links={seekerLinks} /></div>}
      {!bare && <div className="flex items-center gap-2">
        {!isLanding && (signedIn || isSeeker || isStaff) && <AccountMenu seeker={isSeeker} admin={isAdmin} />}
      </div>}
    </div>
  </header>;
}
