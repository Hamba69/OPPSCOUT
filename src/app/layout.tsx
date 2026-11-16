import { WebVitals } from "@/components/web-vitals";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Montserrat } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SeekerFrame } from "@/components/app-shell";
import { SiteHeader } from "@/components/site-header";
import { hasPageSession } from "@/lib/auth";

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

async function SessionAwareHeader(): Promise<React.JSX.Element> {
  return <SiteHeader signedIn={await hasPageSession()} />;
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>): Promise<React.JSX.Element> {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <Suspense fallback={<SiteHeader signedIn={false} />}>
          <SessionAwareHeader />
        </Suspense>
        <SeekerFrame>{children}</SeekerFrame>
        <WebVitals />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
