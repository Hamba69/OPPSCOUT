import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/back-button";
import { DeletePostingButton } from "@/components/delete-posting-button";
import { OpportunityForm } from "@/components/opportunity-form";
import { requirePageAuth } from "@/lib/auth";
import { defaultPosterContact } from "@/lib/poster-contact";
import { getProfileChoices } from "@/lib/profile-options";
import { getRepository } from "@/lib/repository";
import { ownsListing } from "@/services/ingestion/member-submission";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit posting" };

export default async function EditPostingPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization", "admin"]);
  const { id } = await params;
  const opportunity = await (await getRepository()).getOpportunity(id);
  if (!opportunity || !ownsListing(auth, opportunity)) notFound();
  const [choices, contact] = await Promise.all([getProfileChoices(), defaultPosterContact(auth.userId)]);
  return <main className="animate-in flex flex-col gap-5">
    <BackButton fallbackHref="/dashboard" label="Back to my postings" className="self-start" />
    <header className="title-card">
      <h1>Edit posting</h1>
      <p>Saving sends it back to our team for review before it is shown again.</p>
    </header>
    <OpportunityForm choices={choices} initial={opportunity} defaultContact={contact} />
    <section className="surface flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-navy">No longer available? Remove it so nobody applies.</p>
      <DeletePostingButton id={opportunity.id} title={opportunity.title} />
    </section>
  </main>;
}
