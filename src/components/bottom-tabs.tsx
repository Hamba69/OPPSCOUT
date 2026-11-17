"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/components/custom-icon";

const icons: Record<string, IconName> = { Matches: "matches", Saved: "saved", Opportunities: "opportunities" };

const tabs = [
  ["Matches", "/feed"],
  ["Saved", "/saved"],
  ["Opportunities", "/opportunities"],
] as const;

const seekerPaths = [
  "/feed",
  "/saved",
  "/opportunities",
  "/profile",
  "/settings",
  "/opportunity",
  "/feedback",
];

export function BottomTabs(): React.JSX.Element | null {
  const pathname = usePathname();
  if (!seekerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  return (
    <>
      <div className="h-24 md:hidden" aria-hidden="true" />
      <nav
        aria-label="Seeker tabs"
        className="fixed inset-x-3 z-40 rounded-full p-1.5 md:hidden glass-strong"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <ul className="mx-auto flex max-w-md justify-between gap-1">
          {tabs.map(([name, href]) => {
            const active =
              pathname === href ||
              pathname.startsWith(`${href}/`) ||
              (href === "/feed" && pathname.startsWith("/opportunity/"));

            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf ${
                    active ? "border border-[#F5D76E] bg-[#FFF3C4] text-ink" : "text-navy"
                  }`}
                >
                  <Icon name={icons[name]} size={24} />
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
