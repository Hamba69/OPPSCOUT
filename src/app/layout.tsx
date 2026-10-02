import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import type { ReactNode } from "react";
import { BottomTabs } from "@/components/bottom-tabs";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

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

async function isSignedIn(): Promise<boolean> {
  try {
    const { data } = await (await createClient()).auth.getUser();
    return Boolean(data.user);
  } catch {
    return false;
  }
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>): Promise<React.JSX.Element> {
  const signedIn = await isSignedIn();
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <SiteHeader signedIn={signedIn} />
        {children}
        <BottomTabs />
      </body>
    </html>
  );
}
