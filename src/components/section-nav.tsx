"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SectionNav({ links, label, activeHref }: { links: ReadonlyArray<readonly [string, string]>; label: string; activeHref?: string }): React.JSX.Element {
  const pathname = usePathname();
  const currentHref = activeHref ?? pathname;
  return <nav aria-label={label} className="nav-capsule flex-wrap">
    {links.map(([name, href]) => <Link key={href} href={href} aria-current={currentHref === href ? "page" : undefined}
      className={`min-h-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${currentHref === href ? "active" : ""}`}>{name}</Link>)}
  </nav>;
}
