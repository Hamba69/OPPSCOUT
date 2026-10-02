import { OrganizationOnboardingForm } from "@/components/organization-onboarding-form";
import { requirePageAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrganizationOnboardingPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization"]);
  if (auth.role === "organization") redirect("/dashboard");
  return <main className="page-shell animate-in"><div className="text-center"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Register your organization</h1><p className="mx-auto mt-3 max-w-2xl text-navy">Create a workspace to post jobs, scholarships and other opportunities. We verify every organization, and each listing is reviewed before it is published.</p></div><OrganizationOnboardingForm /></main>;
}
