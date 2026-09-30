"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SectionNav } from "@/components/section-nav";

const links = [["Matches", "/feed"], ["Saved", "/saved"], ["Settings", "/settings"]] as const;

export function AppHeader(): React.JSX.Element {
  const pathname = usePathname();
  const isSeekerApp = pathname === "/feed"
    || pathname === "/saved"
    || pathname === "/settings"
    || pathname.startsWith("/opportunity/");
  const activeHref = pathname.startsWith("/opportunity/") ? "/feed" : pathname;

  return (
    <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-4 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold" aria-label="OppScout home">
          <span className="grid size-10 place-items-center rounded-2xl bg-sun shadow-badge" aria-hidden="true">☀</span>
          OppScout
        </Link>
        {isSeekerApp && <SectionNav label="Main navigation" links={links} activeHref={activeHref} />}
      </div>
    </header>
  );
}
