import { redirect } from "next/navigation";

import { AppFrame } from "@/components/app-shell";
import { PublisherSidebar } from "@/components/publisher-sidebar";
import { getOptionalAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProviderLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (!auth) redirect("/organizations/login");
  if (auth.role === "user") redirect("/onboarding/organization");

  return (
    <AppFrame sidebar={<PublisherSidebar />}>{children}</AppFrame>
  );
}
