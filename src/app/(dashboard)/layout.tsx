import { redirect } from "next/navigation";

import { PublisherSidebar } from "@/components/publisher-sidebar";
import { getOptionalAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProviderLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (!auth) redirect("/organizations/login");
  if (auth.role === "user") redirect("/onboarding/organization");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 md:flex-row md:gap-8 lg:px-8">
      <PublisherSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
