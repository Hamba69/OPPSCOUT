import { OpportunityForm } from "@/components/opportunity-form";
import { requirePageAuth } from "@/lib/auth";
import { getProfileChoices } from "@/lib/profile-options";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const choices = await getProfileChoices();
  return <main className="page-shell animate-in"><header className="page-header"><div><p className="eyebrow">Publisher workspace · Opportunity setup</p><h1 className="!text-left !font-extrabold">Post an opportunity</h1><p>Share the official details and explain how people can apply. Every submission is reviewed before publication.</p></div></header><OpportunityForm organizationId={auth.organizationId!} choices={choices} /></main>;
}
