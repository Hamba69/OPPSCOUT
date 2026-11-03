import { WebVitals } from "@/components/web-vitals";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BottomTabs } from "@/components/bottom-tabs";
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

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>): Promise<React.JSX.Element> {
  const signedIn = await hasPageSession();
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <SiteHeader signedIn={signedIn} />
        {children}
        <BottomTabs />
        <WebVitals />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
