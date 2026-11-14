import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { OpportunityActions } from "@/components/opportunity-actions";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { buildRankedFeed } from "@/services/matching/feed";
import { isUserVisibleOpportunity } from "@/services/trust/user-publication-policy";
import { formatDate } from "@/lib/dates";

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
  const savedId = saved.find((item) => item.opportunityId === id)?.id;
  const sourceHref = opportunity.sourceUrl;
  const days = opportunity.deadline ? Math.ceil((opportunity.deadline.getTime() - new Date().getTime()) / 86_400_000) : null;
  const deadlineText = opportunity.deadline ? formatDate(opportunity.deadline, { dateStyle: "medium" }) : "Deadline not published";
  const workMode = opportunity.workMode && opportunity.workMode !== "unknown" ? opportunity.workMode : null;
  const backHref = from === "matches" ? "/feed" : "/opportunities";
  const backLabel = from === "matches" ? "Back to matches" : "Back to opportunities";
  const factBox = (label: string, value: React.ReactNode, accent = false): React.JSX.Element => <div className={`fact ${accent ? "fact-accent" : ""}`}><p className="text-xs font-semibold text-navy">{label}</p><div className="mt-1.5 text-lg font-extrabold capitalize text-ink">{value}</div></div>;
  return <main className="animate-in flex flex-col gap-6">
    <Link href={backHref} className="inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-bold text-navy transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf"><ArrowLeftIcon />{backLabel}</Link>
    <section className="surface !rounded-[1.75rem] !px-6 !py-7 sm:!px-8">
      <h1 className="!m-0 !text-left !text-2xl !font-extrabold !leading-tight text-ink sm:!text-[2rem]">{opportunity.title}</h1>
      <p className="mt-1.5 text-[15px] font-semibold text-navy">{opportunity.organization?.name ?? opportunity.organizationName ?? "Source organization"}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {match
          ? <div className="fact fact-accent"><h2 className="text-xs font-semibold text-navy">Your match</h2><p className="mt-1.5 text-[1.625rem] font-extrabold leading-tight" style={{ color: "var(--match)" }}>{match.score}%</p></div>
          : factBox("Type", opportunity.category, true)}
        {factBox("Deadline", days !== null && days > 0 && days <= 14 ? `${days} ${days === 1 ? "day" : "days"} left` : deadlineText)}
        {factBox("Location", opportunity.location)}
        {factBox("Work mode", workMode ?? "Not stated")}
      </div>
      {!match ? <p className="mt-4 rounded-2xl bg-ink/[.04] p-4 text-sm text-navy">This opportunity is not in your matches, so you may not meet every requirement. Check the details below and the official source before applying.</p> : null}
      <OpportunityActions opportunityId={id} sourceUrl={sourceHref} savedId={savedId} />
    </section>
    {opportunity.description && <section className="surface"><h2 className="surface-title">About this opportunity</h2><p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-ink">{opportunity.description}</p></section>}
  </main>;
}
