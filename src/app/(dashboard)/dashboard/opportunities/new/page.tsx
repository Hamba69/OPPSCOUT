import { OpportunityForm } from "@/components/opportunity-form";
import { requirePageAuth } from "@/lib/auth";
import { getProfileChoices } from "@/lib/profile-options";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const choices = await getProfileChoices();
  return <main className="page-shell animate-in"><header className="text-center"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Post an opportunity</h1><p className="mx-auto mt-2 max-w-2xl text-navy">Share the official details, explain who can apply, and tell people how to take the next step. Every submission is reviewed before publication.</p></header><OpportunityForm organizationId={auth.organizationId!} choices={choices} /></main>;
}
