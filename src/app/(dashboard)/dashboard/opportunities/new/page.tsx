import { OpportunityForm } from "@/components/opportunity-form";
import { requirePageAuth } from "@/lib/auth";
import { getProfileChoices } from "@/lib/profile-options";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const choices = await getProfileChoices();
  return <main className="page-shell animate-in"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Post an opportunity</h1><p className="mt-2 max-w-2xl text-navy">Link the official source and state who can apply. Every listing is reviewed before it is published.</p><OpportunityForm organizationId={auth.organizationId!} choices={choices} /></main>;
}
