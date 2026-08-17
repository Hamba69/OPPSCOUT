import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  const match = (await buildRankedFeed(repository, userId)).find((item) => item.opportunityId === id);
  if (!match) notFound();
  return <main className="page-shell"><div className="grid gap-6 lg:grid-cols-[1fr_20rem]"><article className="card"><span className="pill">✓ {opportunity.organization?.verificationStatus === "verified" ? "Verified organization" : "Verified listing"}</span><h1 className="mt-4 text-4xl font-black">{opportunity.title}</h1><p className="mt-2 font-bold text-ink/60">{opportunity.organization?.name}</p><p className="mt-6 leading-7">{opportunity.description}</p><div className="mt-6 grid gap-3 rounded-blob bg-butter p-5 sm:grid-cols-3"><div><p className="text-xs font-black uppercase">Where</p><p className="mt-1">{opportunity.location}</p></div><div><p className="text-xs font-black uppercase">Mode</p><p className="mt-1 capitalize">{opportunity.workMode}</p></div><div><p className="text-xs font-black uppercase">Deadline</p><p className="mt-1">{opportunity.deadline.toLocaleDateString("en-UG", { dateStyle: "medium" })}</p></div></div><h2 className="mt-8 text-2xl font-black">What the opportunity asks</h2><p className="mt-3 leading-7">{opportunity.applicationMethod}</p><OpportunityActions opportunityId={id} sourceUrl={opportunity.sourceUrl} /></article><aside className="space-y-5"><section className="card bg-sun"><h2 className="text-xs font-black uppercase">Your match</h2><p className="mt-2 text-5xl font-black">{match.score}%</p><p className="mt-2 text-sm font-bold">Rule-based and explainable.</p></section><section className="card"><h2 className="font-black">Why it fits</h2><ul className="mt-3 space-y-3">{match.matchedFactors.map((factor) => <li key={`${factor.label}-${factor.detail}`} className="text-sm"><strong>✓ {factor.label}</strong><br/><span className="text-ink/60">{factor.detail}</span></li>)}</ul></section><section className="card"><h2 className="font-black">Things to mind</h2><ul className="mt-3 space-y-3">{match.missingFactors.map((factor) => <li key={`${factor.label}-${factor.detail}`} className="text-sm"><strong>△ {factor.label}</strong><br/><span className="text-ink/60">{factor.detail}</span></li>)}</ul></section><section className="card text-sm"><p className="font-black">Trust details</p><p className="mt-2">Published {opportunity.publicationDate.toLocaleDateString("en-UG")}</p><p>Checked {opportunity.checkedAt.toLocaleDateString("en-UG")}</p><a className="mt-2 inline-block font-bold underline" href={opportunity.sourceUrl} target="_blank" rel="noreferrer">Open official source ↗</a></section></aside></div></main>;
}
