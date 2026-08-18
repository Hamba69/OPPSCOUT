import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "OppScout", template: "%s · OppScout" },
  description: "Clear, trustworthy opportunities matched to your next step.",
};

const nav = [
  ["Matches", "/feed"], ["Saved", "/saved"], ["Profile", "/profile"], ["Providers", "/onboarding/organization"], ["Account", "/login"],
] as const;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/feed" className="flex items-center gap-2 text-xl font-black" aria-label="OppScout home">
              <span className="grid size-10 place-items-center rounded-2xl border-2 border-ink bg-sun" aria-hidden="true">☀</span>
              OppScout
            </Link>
            <nav aria-label="Main navigation" className="flex items-center gap-1 overflow-x-auto">
              {nav.map(([label, href]) => <Link key={href} href={href} className="rounded-full px-3 py-2 text-sm font-bold hover:bg-butter">{label}</Link>)}
            </nav>
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
