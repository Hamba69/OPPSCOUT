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
          <p className="mt-3 text-navy">Opportunity posting unlocks after our team verifies your official website, matching organization email and URSB registration proof.</p>
          <Link className="button-secondary mt-5" href="/dashboard/organization">Review publisher profile</Link>
        </section>
      </main>
    );
  }
  const choices = await getProfileChoices();
  return <main className="page-shell animate-in"><header className="page-header"><div><p className="eyebrow">Publisher workspace · Opportunity setup</p><h1 className="!text-left !font-extrabold">Post an opportunity</h1><p>Share the official details and explain how people can apply. Every submission is reviewed before publication.</p></div></header><OpportunityForm organizationId={auth.organizationId!} choices={choices} /></main>;
}
