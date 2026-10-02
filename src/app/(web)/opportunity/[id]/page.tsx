import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Link from "next/link";
import { AlertIcon, ArrowLeftIcon, CheckIcon, ExternalIcon } from "@/components/icons";
import { OpportunityActions } from "@/components/opportunity-actions";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Opportunity" };
}

export default async function OpportunityPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params;
  const repository = await getRepository();
  const { userId } = await requirePageAuth(["user"]);
  const opportunity = await repository.getOpportunity(id);
  if (!opportunity || opportunity.verificationStatus !== "verified") notFound();
  const match = (await buildRankedFeed(repository, userId, new Date(), undefined, { persist: false })).find((item) => item.opportunityId === id);
  const sourceHref = opportunity.sourceUrl;
  const days = opportunity.deadline ? Math.ceil((opportunity.deadline.getTime() - new Date().getTime()) / 86_400_000) : null;
  const deadlineText = opportunity.deadline ? opportunity.deadline.toLocaleDateString("en-UG", { dateStyle: "medium" }) : "Open until filled";
  return <main className="page-shell animate-in mx-auto max-w-3xl">
    <Link href="/feed" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-navy hover:text-ink"><ArrowLeftIcon /> Back to matches</Link>
    <span className="badge-verified"><CheckIcon /> {opportunity.organization?.verificationStatus === "verified" ? "Verified organization" : "Verified listing"}</span>
    <h1 className="mt-3 text-2xl font-extrabold text-ink sm:text-4xl">{opportunity.title}</h1>
    <p className="mt-1 font-bold text-navy">{opportunity.organization?.name}</p>
    <section className="card mt-5 flex items-center justify-between gap-4 border-2 border-honey bg-butter">
      {match ? <div><p className="text-xs font-semibold text-navy">Your match</p><p className="text-4xl font-extrabold text-leaf">{match.score}%</p></div> : <div><p className="text-xs font-semibold text-navy">Type</p><p className="font-extrabold capitalize text-ink">{opportunity.category}</p></div>}
      <div className="text-right"><p className="text-xs font-semibold text-navy">Deadline</p><p className="font-extrabold text-ink">{days !== null && days > 0 && days <= 14 ? `${days} ${days === 1 ? "day" : "days"} left` : deadlineText}</p><p className="text-xs capitalize text-navy">{opportunity.location} · {opportunity.workMode}</p></div>
    </section>
    {!match && <p className="mt-3 rounded-2xl bg-ink/[.04] p-4 text-sm text-navy">This opportunity is not in your matches, so you may not meet every requirement. Check the details below and the official source before applying.</p>}
    <OpportunityActions opportunityId={id} sourceUrl={sourceHref} />
    {match && <section className="mt-8"><h2 className="text-lg font-extrabold text-ink">Why it fits</h2><ul className="mt-3 space-y-3">{match.matchedFactors.map((factor) => <li key={`${factor.label}-${factor.detail}`} className="text-sm"><strong className="flex items-center gap-1.5 text-leaf"><CheckIcon /> {factor.label}</strong><span className="text-navy">{factor.detail}</span></li>)}</ul></section>}
    {match && match.missingFactors.length > 0 && <section className="mt-6"><h2 className="text-lg font-extrabold text-ink">To prepare</h2><ul className="mt-3 space-y-3">{match.missingFactors.map((factor) => <li key={`${factor.label}-${factor.detail}`} className="text-sm"><strong className="flex items-center gap-1.5 text-ink"><AlertIcon /> {factor.label}</strong><span className="text-navy">{factor.detail}</span></li>)}</ul></section>}
    <section className="mt-6"><h2 className="text-lg font-extrabold text-ink">About this opportunity</h2><p className="mt-2 leading-7 text-ink">{opportunity.description}</p></section>
    <section className="mt-6"><h2 className="text-lg font-extrabold text-ink">How to apply</h2><p className="mt-2 leading-7 text-ink">{opportunity.applicationMethod}</p></section>
    <p className="mt-6 text-xs text-navy">Published {opportunity.publicationDate.toLocaleDateString("en-UG")} · Source checked {opportunity.checkedAt.toLocaleDateString("en-UG")} · <a className="font-bold underline" href={sourceHref} target="_blank" rel="noreferrer">Open official source <ExternalIcon /></a></p>
  </main>;
}
