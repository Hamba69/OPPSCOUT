"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { Icon } from "@/components/custom-icon";

/** Screens visited inside the app this session. Module state survives client-side navigation. */
let inAppVisits = 0;

/** Mounted once in the root layout: counts in-app page changes so BackButton knows whether "back" stays inside OppScout. */
export function NavigationTracker(): null {
  const pathname = usePathname();
  useEffect(() => { inAppVisits += 1; }, [pathname]);
  return null;
}

/**
 * Round back arrow for the top-left of a page. Returns to the previous in-app screen (so a match opened from a
 * category page goes back to that category); opened directly from a link, it goes to `fallbackHref` instead.
 * `label` is the accessible name, e.g. "Back to matches".
 */
export function BackButton({ fallbackHref, label, className = "" }: { fallbackHref: string; label: string; className?: string }): React.JSX.Element {
  return <Link href={fallbackHref} title={label} className={`icon-button back-button ${className}`}
    onClick={(event) => {
      if (inAppVisits > 1 && !event.metaKey && !event.ctrlKey && !event.shiftKey) { event.preventDefault(); window.history.back(); }
    }}>
    <Icon name="back" size={20} strokeWidth={2.25} />
    <span className="sr-only">{label}</span>
  </Link>;
}
