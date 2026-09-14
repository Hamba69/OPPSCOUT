"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SectionNav({ links, label }: { links: ReadonlyArray<readonly [string, string]>; label: string }): React.JSX.Element {
  const pathname = usePathname();
  return <nav aria-label={label} className="flex flex-wrap items-center gap-1">
    {links.map(([name, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
      className={`min-h-11 rounded-full px-3 py-3 text-sm font-bold transition-colors hover:bg-butter focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${pathname === href ? "bg-butter" : ""}`}>{name}</Link>)}
  </nav>;
}
