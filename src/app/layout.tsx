import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { SectionNav } from "@/components/section-nav";

import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: { default: "OppScout", template: "%s · OppScout" },
  description: "Clear, trustworthy opportunities matched to your next step.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): React.JSX.Element {
  const nav = [["Matches", "/feed"], ["Saved", "/saved"], ["Profile", "/profile"], ["Settings", "/settings"], ["Providers", "/onboarding/organization"], ["Account", "/login"]] as const;
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-4 lg:px-8">
            <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold" aria-label="OppScout home">
              <span className="grid size-10 place-items-center rounded-2xl bg-sun shadow-badge" aria-hidden="true">☀</span>
              OppScout
            </Link>
            <SectionNav label="Main navigation" links={nav} />
          </div>
        </header>
        {children}
        <footer className="page-shell text-sm text-muted">
          <div className="flex flex-wrap justify-between gap-3 border-t border-ink/[.06] pt-6"><span>Built for clear next steps in Uganda.</span><span>No application fees. Verify every source.</span></div>
        </footer>
      </body>
    </html>
  );
}
