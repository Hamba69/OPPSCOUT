import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { OpportunityActions } from "@/components/opportunity-actions";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> };
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Opportunity" };
}

export default async function OpportunityPage({ params, searchParams }: Props): Promise<React.JSX.Element> {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const [repository, auth] = await Promise.all([getRepository(), requirePageAuth(["user"])]);
  const { userId } = auth;
  const opportunity = await repository.getOpportunity(id);
  if (!opportunity || !isUserVisibleOpportunity(opportunity)) notFound();
  const [match, saved] = await Promise.all([
    buildRankedFeed(repository, userId, new Date(), undefined, { persist: false, telemetry: false, opportunityIds: new Set([id]), opportunities: [opportunity] })
      .then((matches) => matches.find((item) => item.opportunityId === id)),
    repository.listSaved(userId),
  ]);
  if (!match) notFound();
  const savedId = saved.find((item) => item.opportunityId === id)?.id;
  const sourceHref = opportunity.sourceUrl;
  const days = opportunity.deadline ? Math.ceil((opportunity.deadline.getTime() - new Date().getTime()) / 86_400_000) : null;
  const deadlineText = opportunity.deadline ? opportunity.deadline.toLocaleDateString("en-UG", { dateStyle: "medium" }) : "Deadline not published";
  const workMode = opportunity.workMode && opportunity.workMode !== "unknown" ? opportunity.workMode : null;
  const backHref = from === "matches" ? "/feed" : "/opportunities";
  const backLabel = from === "matches" ? "Back to matches" : "Back to opportunities";
  return <main className="page-shell animate-in mx-auto max-w-3xl">
    <Link href={backHref} aria-label={backLabel} title={backLabel} className="mb-2 inline-flex size-11 items-center justify-center rounded-full text-navy transition hover:bg-butter hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf"><ArrowLeftIcon /></Link>
    <h1 className="mt-3 text-2xl font-extrabold text-ink sm:text-4xl">{opportunity.title}</h1>
    <p className="mt-1 font-bold text-navy">{opportunity.organization?.name ?? opportunity.organizationName ?? "Source organization"}</p>
    <section className="card mt-5 flex items-center justify-between gap-4 border-2 border-honey bg-butter">
      {match ? <div><p className="text-xs font-semibold text-navy">Your match</p><p className="text-4xl font-extrabold text-leaf">{match.score}%</p></div> : <div><p className="text-xs font-semibold text-navy">Type</p><p className="font-extrabold capitalize text-ink">{opportunity.category}</p></div>}
      <div className="text-right"><p className="text-xs font-semibold text-navy">Deadline</p><p className="font-extrabold text-ink">{days !== null && days > 0 && days <= 14 ? `${days} ${days === 1 ? "day" : "days"} left` : deadlineText}</p><p className="text-xs capitalize text-navy">{opportunity.location}{workMode ? ` · ${workMode}` : ""}</p></div>
    </section>
    {!match ? <p className="mt-3 rounded-2xl bg-ink/[.04] p-4 text-sm text-navy">This opportunity is not in your matches, so you may not meet every requirement. Check the details below and the official source before applying.</p> : null}
    <OpportunityActions opportunityId={id} sourceUrl={sourceHref} savedId={savedId} />
    {opportunity.description && <section className="mt-6"><h2 className="text-lg font-extrabold text-ink">About this opportunity</h2><p className="mt-2 leading-7 text-ink">{opportunity.description}</p></section>}
  </main>;
}
