import Link from "next/link";

import { OpportunityForm } from "@/components/opportunity-form";
import { requirePageAuth } from "@/lib/auth";
import { getProfileChoices } from "@/lib/profile-options";
import { getRepository } from "@/lib/repository";
import { publisherCanPost } from "@/lib/publisher-verification";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const organization = auth.organizationId
    ? await (await getRepository()).getOrganization(auth.organizationId)
    : null;
  if (!organization) throw new Error("Publisher profile is missing.");
  if (!await publisherCanPost(organization)) {
    return (
      <main className="page-shell animate-in">
        <section className="card mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-extrabold text-ink">Publisher verification required</h1>
          <p className="mt-3 text-navy">Opportunity posting unlocks after our team verifies your organization and official contact details.</p>
          <Link className="button-secondary mt-5" href="/dashboard/organization">Review publisher profile</Link>
        </section>
      </main>
    );
  }
  const choices = await getProfileChoices();
  return (
    <main className="animate-in flex flex-col gap-5">
      <Link className="inline-flex min-h-11 items-center gap-1 text-[13px] font-bold text-navy" href="/dashboard/opportunities">
        <span aria-hidden="true">←</span>Back to opportunities
      </Link>
      <header className="title-card">
        <h1>Post an opportunity</h1>
        <p>Every listing is reviewed by the OppScout team before it is published.</p>
      </header>
      <OpportunityForm organizationId={auth.organizationId!} choices={choices} />
    </main>
  );
}
