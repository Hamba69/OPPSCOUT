"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function AdminNav({ sections }: { sections: readonly string[] }): React.JSX.Element {
  const pathname = usePathname();
  const active = useRef<HTMLAnchorElement>(null);

  // On phones the tab strip scrolls sideways, so keep the open tab in view.
  useEffect(() => {
    active.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return <nav aria-label="Portal sections" className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
    {sections.map((section) => {
      const href = `/admin/${section}`;
      const isActive = pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={section} ref={isActive ? active : undefined} href={href} aria-current={isActive ? "page" : undefined}
        className={`flex min-h-11 shrink-0 items-center rounded-xl px-3 text-sm capitalize transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink lg:border-l-4 ${isActive ? "bg-ink font-extrabold text-cream shadow-soft lg:border-l-honey" : "font-semibold text-navy hover:bg-butter hover:text-ink lg:border-l-transparent"}`}>
        {section.replace(/-/g, " ")}
      </Link>;
    })}
  </nav>;
}
