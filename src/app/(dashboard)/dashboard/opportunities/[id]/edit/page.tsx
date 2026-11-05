import { notFound } from "next/navigation";

import { OpportunityForm } from "@/components/opportunity-form";
import { requirePageAuth } from "@/lib/auth";
import { getProfileChoices } from "@/lib/profile-options";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const { id } = await params;
  const repository = await getRepository();
  const opportunity = await repository.getOpportunity(id);
  if (!opportunity || opportunity.organizationId !== auth.organizationId || opportunity.origin !== "organization") notFound();

  const choices = await getProfileChoices();
  return <main className="page-shell animate-in"><header className="page-header"><div><p className="eyebrow">Publisher workspace · Opportunity setup</p><h1 className="!text-left !font-extrabold">Edit opportunity</h1><p>Update your listing. Changes go through review again before republication.</p></div></header><OpportunityForm organizationId={auth.organizationId!} choices={choices} initial={opportunity} /></main>;
}