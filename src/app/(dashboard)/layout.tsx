import { redirect } from "next/navigation";

import { SectionNav } from "@/components/section-nav";
import { getOptionalAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProviderLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (!auth) redirect("/organizations/login");
  if (auth.role === "user") redirect("/onboarding/organization");

  return <><div className="mx-auto w-fit max-w-full px-2 pt-1"><SectionNav label="Publisher tools" links={[["Overview", "/dashboard"], ["Opportunities", "/dashboard/opportunities"], ["Matches", "/dashboard/candidates"], ["Profile", "/dashboard/organization"]]} /></div>{children}</>;
}
