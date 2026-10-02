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
  if (!match) notFound();
  const sourceHref = opportunity.sourceUrl;
  return <main className="page-shell animate-in"><Link href="/feed" className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-navy hover:text-ink"><ArrowLeftIcon /> Back to matches</Link><div className="grid gap-6 lg:grid-cols-[1fr_20rem]"><article className="card"><span className="badge-verified"><CheckIcon /> {opportunity.organization?.verificationStatus === "verified" ? "Verified organization" : "Verified listing"}</span><h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">{opportunity.title}</h1><p className="mt-2 font-bold text-navy">{opportunity.organization?.name}</p><p className="mt-6 leading-7 text-ink">{opportunity.description}</p><div className="mt-6 grid gap-4 rounded-blob border border-honey/60 bg-butter p-5 sm:grid-cols-3"><div><p className="text-sm font-bold text-navy">Location</p><p className="mt-1">{opportunity.location}</p></div><div><p className="text-sm font-bold text-navy">Work mode</p><p className="mt-1 capitalize">{opportunity.workMode}</p></div><div><p className="text-sm font-bold text-navy">Deadline</p><p className="mt-1">{opportunity.deadline?.toLocaleDateString("en-UG", { dateStyle: "medium" }) ?? "No closing date published; check the official source"}</p></div></div><h2 className="mt-8 text-xl font-extrabold text-ink">What the opportunity asks</h2><p className="mt-3 leading-7 text-ink">{opportunity.applicationMethod}</p><OpportunityActions opportunityId={id} sourceUrl={sourceHref} /></article><aside className="space-y-5"><section className="card border-2 border-honey bg-butter"><h2 className="text-sm font-bold text-navy">Your match</h2><p className="mt-1 text-5xl font-extrabold text-leaf">{match.score}%</p><p className="mt-2 text-sm text-navy">Worked out from your profile and what this listing asks for.</p></section><section className="card"><h2 className="font-extrabold">Why it fits</h2><ul className="mt-3 space-y-3">{match.matchedFactors.map((factor) => <li key={`${factor.label}-${factor.detail}`} className="text-sm"><strong className="flex items-center gap-1.5 text-leaf"><CheckIcon /> {factor.label}</strong><span className="text-navy">{factor.detail}</span></li>)}</ul></section><section className="card"><h2 className="font-extrabold">Things to prepare</h2><ul className="mt-3 space-y-3">{match.missingFactors.map((factor) => <li key={`${factor.label}-${factor.detail}`} className="text-sm"><strong className="flex items-center gap-1.5 text-ink"><AlertIcon /> {factor.label}</strong><span className="text-navy">{factor.detail}</span></li>)}</ul></section><section className="card text-sm"><p className="font-extrabold">Trust details</p><p className="mt-2">Published {opportunity.publicationDate.toLocaleDateString("en-UG")}</p><p>Checked {opportunity.checkedAt.toLocaleDateString("en-UG")}</p><a className="mt-2 inline-flex items-center gap-1 font-bold underline" href={sourceHref} target="_blank" rel="noreferrer">Open official source <ExternalIcon /></a></section></aside></div></main>;
}
