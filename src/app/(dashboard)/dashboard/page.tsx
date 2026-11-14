import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import Link from "next/link";

import { Icon } from "@/components/app-shell";
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
    { label: "Total opportunities", value: opportunities.length, detail: "All opportunities you have submitted", icon: "opportunities" },
    { label: "Published", value: opportunities.filter((item) => item.verificationStatus === "verified").length, detail: "Verified and visible to opportunity seekers", icon: "check" },
    { label: "In review", value: opportunities.filter((item) => item.verificationStatus === "pending").length, detail: "Awaiting a review by the OppScout team", icon: "clock" },
  ] as const;
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Kampala" }).format(new Date()));
  const salutation = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const recentOpportunities = [...opportunities]
    .sort((a, b) => b.publicationDate.getTime() - a.publicationDate.getTime())
    .slice(0, 5);

  return (
    <main className="animate-in flex flex-col gap-6">
      <section className="surface flex flex-wrap items-center gap-5 !rounded-[1.75rem] !px-6 !py-7 sm:!px-8">
        <div className="orb size-14 shrink-0" aria-hidden="true" />
        <div className="min-w-[240px] flex-1">
          <h1 className="!m-0 !text-left !text-2xl !font-medium !leading-tight text-ink sm:!text-[1.625rem]">{salutation}, <strong className="font-extrabold">{organization.name}</strong></h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-navy"><span>Publisher workspace</span><span aria-hidden="true">·</span><StatusBadge value={organization.verificationStatus} /></p>
          <p aria-label="Publisher account status" className="mt-1 text-[13px] text-navy">
            {organization.verificationStatus === "verified"
              ? "Your publisher profile is verified."
              : organization.verificationStatus === "pending"
                ? "Your profile is being reviewed by the OppScout team."
                : organization.verificationStatus === "flagged"
                  ? "Your profile needs follow-up from the OppScout team."
                  : "Your profile has not been verified yet."}
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

      <section className="surface" aria-labelledby="recent-opportunities-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="recent-opportunities-heading" className="surface-title">Latest postings</h2>
          <Link className="text-[13px] font-bold text-[#6B4E00] underline-offset-4 hover:underline" href="/dashboard/opportunities">View all postings</Link>
        </div>
        {recentOpportunities.length ? (
          <ul className="divide-y divide-ink/[.07] border-t border-ink/[.07]">
            {recentOpportunities.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-ink">{item.title}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-navy"><span className="cat-pill">{item.category}</span>{item.deadline ? `Closes ${item.deadline.toLocaleDateString("en-UG")}` : "Rolling deadline"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge value={item.verificationStatus} />
                  <Link className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-bold text-[#6B4E00]" href={`/dashboard/opportunities/${item.id}/edit`}><Icon name="edit" size={14} />Edit</Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-navy">Your submitted opportunities will appear here with their review status.</p>
        )}
      </section>
    </main>
  );
}
