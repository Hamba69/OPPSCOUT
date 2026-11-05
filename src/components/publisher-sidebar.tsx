"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Overview", "/dashboard"],
  ["Opportunities", "/dashboard/opportunities"],
  ["Matches", "/dashboard/candidates"],
  ["Analytics", "/dashboard/analytics"],
  ["Monetization", "/dashboard/monetization"],
  ["Publisher profile", "/dashboard/organization"],
] as const;

export function PublisherSidebar(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 md:w-56 md:pt-6">
      <nav aria-label="Publisher dashboard" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:overflow-visible md:px-0">
        {links.map(([label, href]) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={`rail-link ${active ? "bg-butter text-ink" : ""}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
