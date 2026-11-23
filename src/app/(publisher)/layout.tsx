import { redirect } from "next/navigation";

import { AppFrame } from "@/components/app-shell";
import { PublisherSidebar } from "@/components/publisher-sidebar";
import { getOptionalAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * The publisher end: where anyone signed in posts opportunities and manages them. It is separate from the
 * seeker app (its own menu, no matches or profile), and needs no organisation account.
 */
export default async function PublisherLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (!auth) redirect("/login?next=%2Fdashboard");
  return <AppFrame sidebar={<PublisherSidebar />}>{children}</AppFrame>;
}
