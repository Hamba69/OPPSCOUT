import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SectionNav } from "@/components/section-nav";
import { isMemoryDataMode } from "@/lib/repository";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "OppScout", template: "%s · OppScout" },
  description: "Clear, trustworthy opportunities matched to your next step.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): React.JSX.Element {
  const memory = isMemoryDataMode();
  const nav = [["Matches", "/feed"], ["Saved", "/saved"], ["Profile", "/profile"], ["Settings", "/settings"], ["Providers", memory ? "/dashboard" : "/onboarding/organization"], [memory ? "Switch persona" : "Account", "/login"]] as const;
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-4 lg:px-8">
            <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-black" aria-label="OppScout home">
              <span className="grid size-10 place-items-center rounded-2xl border-2 border-ink bg-sun" aria-hidden="true">☀</span>
              OppScout
            </Link>
            <SectionNav label="Main navigation" links={nav} />
          </div>
        </header>
        {children}
        <footer className="page-shell border-t border-ink/10 text-sm text-ink/60">
          <div className="flex flex-wrap justify-between gap-3"><span>Built for clear next steps in Uganda.</span><span>No application fees. Verify every source.</span></div>
        </footer>
      </body>
    </html>
  );
}
