import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";

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
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <AppHeader />
        {children}
        <footer className="page-shell text-sm text-muted">
          <div className="flex flex-wrap justify-between gap-3 border-t border-ink/[.06] pt-6"><span>Built for clear next steps in Uganda.</span><span>No application fees. Verify every source.</span></div>
        </footer>
      </body>
    </html>
  );
}
