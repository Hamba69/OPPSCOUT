"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SectionNav } from "@/components/section-nav";

export function HeaderNav({ links }: { links: ReadonlyArray<readonly [string, string]> }): React.JSX.Element | null {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>
    <div className="hidden md:block"><SectionNav label="Main navigation" links={links} /></div>
    <Link href="/login" className="rounded-full border-2 border-honey px-4 py-1.5 text-sm font-semibold text-ink md:hidden">Sign in</Link>
  </>;
}
