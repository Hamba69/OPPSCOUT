import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import Link from "next/link";

import { Icon } from "@/components/app-shell";
import { PublisherOpportunityTable } from "@/components/publisher-opportunity-table";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const organizationId = auth.organizationId;
  if (!organizationId) throw new Error("Publisher account is missing its organization.");
  const repository = await getRepository();
  const [organization, opportunities] = await Promise.all([
    repository.getOrganization(organizationId),
    repository.listOpportunities({ organizationId, origin: "organization" }),
  ]);
  if (!organization) throw new Error("Publisher profile is missing.");

  const metrics = [
    { label: "Total opportunities", value: opportunities.length, detail: "Across all statuses", icon: "opportunities" },
    { label: "Published", value: opportunities.filter((item) => item.verificationStatus === "verified").length, detail: "Visible to matched people", icon: "check" },
    { label: "In review", value: opportunities.filter((item) => item.verificationStatus === "pending").length, detail: "Usually reviewed within 2 days", icon: "clock" },
  ] as const;
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Kampala" }).format(new Date()));
  const salutation = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const statusSentence = organization.verificationStatus === "verified"
    ? "Your publisher profile is verified."
    : organization.verificationStatus === "pending"
      ? "Your profile is being reviewed by the OppScout team."
      : organization.verificationStatus === "flagged"
        ? "Your profile needs follow-up from the OppScout team."
        : "Your profile has not been verified yet.";

  const recentOpportunities = [...opportunities]
    .sort((a, b) => b.publicationDate.getTime() - a.publicationDate.getTime())
    .slice(0, 5);

  return (
    <main className="animate-in flex flex-col gap-6">
      <section className="surface flex flex-wrap items-center gap-5 !rounded-[1.75rem] !px-8 !py-7">
        <div className="orb size-14 shrink-0" aria-hidden="true" />
        <div className="min-w-[240px] flex-1">
          <h1 className="!m-0 !text-left !text-[1.625rem] !font-medium !leading-tight text-ink">{salutation}, <strong className="font-extrabold">{organization.name}</strong></h1>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-navy"><span>Publisher workspace</span><span aria-hidden="true">·</span><StatusBadge value={organization.verificationStatus} /></p>
          <p aria-label="Publisher account status" title={statusSentence} className="mt-1 text-[13px] text-navy">
            {statusSentence}
          </p>
        </div>
        <Link className="button !min-h-11" href="/dashboard/opportunities/new"><Icon name="plus" size={15} strokeWidth={2.2} />Post an opportunity</Link>
      </section>

      <section aria-label="Publisher overview metrics" className="grid gap-3.5 sm:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.label} className="stat-card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-semibold text-navy">{metric.label}</h2>
              <span className="icon-chip !size-9 !rounded-[11px]"><Icon name={metric.icon} size={17} /></span>
            </div>
            <div>
              <p className="text-[1.875rem] font-extrabold leading-tight tracking-tight text-ink">{metric.value}</p>
              <p className="text-xs text-navy">{metric.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <PublisherOpportunityTable
        opportunities={recentOpportunities}
        title="Latest postings"
        action={{ href: "/dashboard/opportunities", label: "View all postings" }}
      />
    </main>
  );
}
