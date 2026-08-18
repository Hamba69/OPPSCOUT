import { OrganizationOnboardingForm } from "@/components/organization-onboarding-form";
import { requirePageAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrganizationOnboardingPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization"]);
  if (auth.role === "organization") redirect("/dashboard");
  return <main className="page-shell"><div className="text-center"><p className="eyebrow">Provider onboarding</p><h1 className="mt-2 text-4xl font-black">Publish trustworthy opportunities.</h1><p className="mx-auto mt-3 max-w-2xl text-ink/60">Create your organization workspace. An admin verifies the organization and every submitted listing remains pending until its trust checks pass.</p></div><OrganizationOnboardingForm /></main>;
}
