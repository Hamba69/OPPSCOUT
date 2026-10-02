"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icons: Record<string, React.JSX.Element> = {
  Matches: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  Saved: <path d="M6 3h12v18l-6-4-6 4z" />,
  Opportunities: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>,
  Search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
};
const tabs = [["Matches", "/feed"], ["Saved", "/saved"], ["Opportunities", "/opportunities"], ["Search", "/search"]] as const;
const seekerPaths = ["/feed", "/saved", "/opportunities", "/search", "/profile", "/settings", "/opportunity"];

export function BottomTabs(): React.JSX.Element | null {
  const pathname = usePathname();
  if (!seekerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return null;
  return <><div className="h-24 md:hidden" aria-hidden="true" /><nav aria-label="Seeker tabs" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white px-2 pt-2 md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
    <ul className="mx-auto flex max-w-md justify-around">
      {tabs.map(([name, href]) => {
        const active = pathname === href || pathname.startsWith(`${href}/`) || (href === "/feed" && pathname.startsWith("/opportunity/"));
        return <li key={href}><Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-12 min-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[11px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf ${active ? "bg-honey text-ink" : "text-navy"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>{name}
        </Link></li>;
      })}
    </ul>
  </nav></>;
}
