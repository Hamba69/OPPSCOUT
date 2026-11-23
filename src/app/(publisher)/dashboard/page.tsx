import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PublisherOpportunityTable } from "@/components/publisher-opportunity-table";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { listOwnListings } from "@/services/ingestion/member-submission";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My postings" };

export default async function MyPostingsPage({ searchParams }: { searchParams: Promise<{ posted?: string; updated?: string }> }): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["user", "organization", "admin"]);
  const [{ posted, updated }, listings] = await Promise.all([searchParams, listOwnListings(await getRepository(), auth)]);
  return <main className="animate-in flex flex-col gap-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <header className="title-card"><h1>My postings</h1></header>
      {listings.length > 0 && <Link href="/dashboard/new" className="button">Post an opportunity</Link>}
    </div>
    {(posted || updated) && <p role="status" className="rounded-2xl glass-notice p-4 text-sm font-semibold text-ink">
      {posted ? "Thanks, your opportunity was submitted." : "Your changes were saved."} A reviewer will check it, and may call, email or WhatsApp you, before it goes live. This usually takes up to 2 working days.
    </p>}
    {listings.length ? <>
      <PublisherOpportunityTable opportunities={listings} title="Your listings" filterable />
      <section className="surface text-sm text-navy" aria-label="What the statuses mean">
        <p><strong className="text-ink">In review:</strong> waiting for our team. <strong className="text-ink">Published:</strong> live for people it suits. <strong className="text-ink">Changes requested:</strong> edit it and save to send it back for review. <strong className="text-ink">Closed:</strong> past its closing date or taken down.</p>
      </section>
    </> : <EmptyState title="Share your first opportunity" description="Post a job, internship, scholarship, fellowship or grant. Our team reviews every post before it goes live." href="/dashboard/new" action="Post an opportunity" background="white" />}
  </main>;
}
