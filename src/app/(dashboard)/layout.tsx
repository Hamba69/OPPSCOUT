import { redirect } from "next/navigation";

import { SectionNav } from "@/components/section-nav";
import { getOptionalAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile-store";

export const dynamic = "force-dynamic";

export default async function ProviderLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (!auth) redirect("/organizations/login");
  if (auth.role === "user") redirect((await getUserProfile(auth.userId)) ? "/feed" : "/onboarding/organization");

  return <><div className="page-shell pb-0 pt-4"><SectionNav label="Publisher tools" links={[["Overview", "/dashboard"], ["Opportunities", "/dashboard/opportunities"], ["Matched people", "/dashboard/candidates"], ["Publisher profile", "/dashboard/organization"]]} /></div>{children}</>;
}
