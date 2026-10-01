import type { Metadata } from "next";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import type { ReactNode } from "react";
import { BottomTabs } from "@/components/bottom-tabs";
import { Logo } from "@/components/logo";
import { HeaderNav } from "@/components/header-nav";

import "./globals.css";

const sans = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: { default: "OppScout", template: "%s · OppScout" },
  description: "Meet your opportunities. Verified jobs, scholarships, grants and internships matched to you.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): React.JSX.Element {
  const nav = [["Home", "/feed"], ["Saved", "/saved"], ["Profile", "/profile"], ["Settings", "/settings"], ["Providers", "/onboarding/organization"], ["Account", "/login"]] as const;
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <header className="sticky top-0 z-30 border-b border-ink/[.06] bg-cream/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight text-ink" aria-label="OppScout home">
              <Logo size={36} />
              oppscout
            </Link>
            <HeaderNav links={nav} />
          </div>
        </header>
        {children}
        <BottomTabs />
        <footer className="page-shell text-sm text-navy">
          <div className="flex flex-wrap justify-between gap-3 border-t border-ink/[.06] pt-6"><span>Built for clear next steps in Uganda.</span><span className="flex flex-wrap gap-x-4"><Link href="/onboarding/organization" className="font-semibold text-ink underline">For organizations</Link><span>No application fees. Verify every source.</span></span></div>
        </footer>
      </body>
    </html>
  );
}
