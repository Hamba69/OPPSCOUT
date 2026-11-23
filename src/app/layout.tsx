import { WebVitals } from "@/components/web-vitals";
import type { Metadata } from "next";
import { publicSiteUrl } from "@/config/app";
import { Montserrat } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SeekerFrame } from "@/components/app-shell";
import { SiteHeader } from "@/components/site-header";
import { NavigationTracker } from "@/components/back-button";

import "./globals.css";

const sans = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const description = "Meet your opportunities. Jobs, scholarships, grants and internships in Uganda, reviewed by our team and matched to you.";

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl()),
  title: { default: "OppScout", template: "%s · OppScout" },
  description,
  applicationName: "OppScout",
  openGraph: {
    type: "website",
    siteName: "OppScout",
    title: "OppScout",
    description,
    url: "/",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "OppScout" }],
  },
  twitter: { card: "summary", title: "OppScout", description, images: ["/logo.png"] },
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>): Promise<React.JSX.Element> {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <SiteHeader />
        <NavigationTracker />
        <SeekerFrame>{children}</SeekerFrame>
        <WebVitals />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
