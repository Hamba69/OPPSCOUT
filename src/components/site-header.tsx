"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/logo";

const seekerPaths = ["/feed", "/saved", "/opportunities", "/profile", "/settings", "/feedback", "/opportunity"];

export function SiteHeader(): React.JSX.Element | null {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isSeeker = seekerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  // The publisher area has its own menu with the logo, like the seeker app, so it needs no header either.
  const isPublisher = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isStaff = isAdmin;
  const home = isAdmin ? "/admin/overview" : "/";
  if (isSeeker || isPublisher) return null;
  return <header className={isLanding ? "relative z-30" : `sticky top-0 z-30 ${isStaff ? "md:hidden" : ""} border-b border-white/70 bg-white/45 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-xl backdrop-saturate-150`}>
    <div className={`mx-auto grid ${isLanding ? "min-h-20" : "min-h-16"} max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8`}>
      <Link href={home} className="flex shrink-0 items-center gap-2 justify-self-start text-xl font-bold tracking-tight text-ink" aria-label="OppScout home"><Logo size={34} /><span className={isLanding ? "max-[380px]:sr-only" : undefined}>oppscout</span></Link>
      <div className="flex items-center gap-2 justify-self-end">
        {isLanding && <>
          <Link href="/login" className="button-secondary !min-h-11 !px-3 text-sm sm:!px-5">Log in</Link>
          <Link href="/profile" className="button !min-h-11 !px-3 text-sm sm:!px-5">Get started</Link>
        </>}
      </div>
    </div>
  </header>;
}
