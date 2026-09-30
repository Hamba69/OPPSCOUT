import { OpportunityForm } from "@/components/opportunity-form";
import { requirePageAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  return <main className="page-shell animate-in"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Make it easy to trust.</h1><p className="mt-2 max-w-2xl text-navy">Use the official source and spell out eligibility. Every listing is reviewed before it reaches a feed.</p><OpportunityForm organizationId={auth.organizationId!} /></main>;
}
