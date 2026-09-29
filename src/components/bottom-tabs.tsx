"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icons: Record<string, React.JSX.Element> = {
  Home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  Saved: <path d="M6 3h12v18l-6-4-6 4z" />,
  Profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></>,
  Settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
};
const tabs = [["Home", "/feed"], ["Saved", "/saved"], ["Profile", "/profile"], ["Settings", "/settings"]] as const;
const seekerPaths = ["/feed", "/saved", "/profile", "/settings", "/opportunity"];

export function BottomTabs(): React.JSX.Element | null {
  const pathname = usePathname();
  if (!seekerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return null;
  return <nav aria-label="Seeker tabs" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white px-2 pt-2 md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
    <ul className="mx-auto flex max-w-md justify-around">
      {tabs.map(([name, href]) => {
        const active = pathname === href || (href === "/feed" && pathname.startsWith("/opportunity"));
        return <li key={href}><Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-2xl px-3 text-[11px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf ${active ? "bg-honey text-ink" : "text-navy"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>{name}
        </Link></li>;
      })}
    </ul>
  </nav>;
}
