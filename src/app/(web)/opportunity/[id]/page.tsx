import { isMatchScore } from "@/config/match-threshold";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/back-button";
import { scoreTier } from "@/components/score-first-card";
import { choiceLabel } from "@/services/profile/choices";
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
      .then((matches) => matches.find((item) => item.opportunityId === id && isMatchScore(item.score))),
    repository.listSaved(userId),
  ]);
  const savedId = saved.find((item) => item.opportunityId === id)?.id;
  const sourceHref = opportunity.sourceUrl;
  const backHref = from === "matches" ? "/feed" : "/opportunities";
  const backLabel = from === "matches" ? "Back to matches" : "Back to opportunities";
  return <main className="animate-in flex flex-col gap-6">
    <BackButton fallbackHref={backHref} label={backLabel} className="self-start" />
    <section className="surface !rounded-[1.75rem] !px-6 !py-7 sm:!px-8">
      <h1 className="!m-0 !text-left !text-2xl !font-extrabold !leading-tight text-ink sm:!text-[2rem]">{opportunity.title}</h1>
      <p className="mt-1.5 text-[15px] font-semibold text-navy">{opportunity.organization?.name ?? opportunity.organizationName ?? "Source organization"}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {match
          ? <p className={`score-badge score-block score-${scoreTier(match.score)}`}><span className="text-base font-extrabold">{match.score}%</span> match</p>
          : <p className="cat-pill">{choiceLabel(opportunity.category)}</p>}
      </div>
      {!match ? <p className="mt-4 rounded-2xl glass-inset p-4 text-sm text-navy">This opportunity is not in your matches, so you may not meet every requirement. Check the details below and the official source before applying.</p> : null}
      <OpportunityActions opportunityId={id} sourceUrl={sourceHref} savedId={savedId} />
    </section>
    {opportunity.description && <section className="surface"><h2 className="surface-title">About this opportunity</h2><p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-ink">{opportunity.description}</p></section>}
  </main>;
}
