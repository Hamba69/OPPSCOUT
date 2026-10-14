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
  return <main className="page-shell animate-in"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Edit opportunity</h1><p className="mt-2 max-w-2xl text-navy">Update the listing details. Changes are reviewed again before the opportunity is republished.</p><OpportunityForm organizationId={auth.organizationId!} choices={choices} initial={opportunity} /></main>;
}