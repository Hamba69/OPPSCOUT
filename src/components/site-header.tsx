"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Logo } from "@/components/logo";
import { SectionNav } from "@/components/section-nav";

const seekerLinks = [["Matches", "/feed"], ["Saved", "/saved"], ["Opportunities", "/opportunities"]] as const;
const seekerPaths = ["/feed", "/saved", "/opportunities", "/profile", "/settings", "/opportunity"];
const bareHeaderPaths = ["/login", "/reset-password"];

function AccountMenu({ seeker }: { seeker: boolean }): React.JSX.Element {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [pathname]);

  function closeMenu(): void {
    menuRef.current?.removeAttribute("open");
  }

  return <details ref={menuRef} className="relative">
    <summary aria-label={seeker ? "Profile and settings" : "Account"} className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border-2 border-honey bg-butter text-ink [&::-webkit-details-marker]:hidden">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></svg>
    </summary>
    <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-ink/10 bg-white p-2 shadow-soft">
      {seeker ? <>
        <Link href="/profile" onClick={closeMenu} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-butter">My profile</Link>
        <Link href="/settings" onClick={closeMenu} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-butter">Settings</Link>
      </> : <form action="/auth/logout" method="post"><button onClick={closeMenu} className="flex min-h-11 w-full items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-butter">Sign out</button></form>}
    </div>
  </details>;
}

export function SiteHeader({ signedIn }: { signedIn: boolean }): React.JSX.Element {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isSeeker = seekerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isStaff = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const bare = bareHeaderPaths.includes(pathname);
  const home = isSeeker ? "/feed" : isStaff ? (pathname.startsWith("/admin") ? "/admin/kpis" : "/dashboard") : "/";

  return <header className="sticky top-0 z-30 border-b border-ink/[.06] bg-cream/95 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
      <Link href={home} className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight text-ink" aria-label="OppScout home"><Logo size={34} />oppscout</Link>
      {isSeeker && <div className="hidden md:block"><SectionNav label="Main navigation" links={seekerLinks} /></div>}
      {!bare && <div className="flex items-center gap-2">
        {!isLanding && (signedIn || isSeeker || isStaff) && <AccountMenu seeker={isSeeker} />}
      </div>}
    </div>
  </header>;
}
