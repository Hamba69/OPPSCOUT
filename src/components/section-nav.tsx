"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SectionNav({ links, label }: { links: ReadonlyArray<readonly [string, string]>; label: string }): React.JSX.Element {
  const pathname = usePathname();
  return <nav aria-label={label} className="nav-capsule flex-wrap">
    {links.map(([name, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
      className={`min-h-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${pathname === href ? "active" : ""}`}>{name}</Link>)}
  </nav>;
}
