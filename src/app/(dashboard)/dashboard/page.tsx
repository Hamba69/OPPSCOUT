import Link from "next/link";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";
export default async function DashboardPage(): Promise<React.JSX.Element> {
  const repository = await getRepository(); const auth = await requirePageAuth(["organization"]); const organizationId = auth.organizationId!;
  const [organization, opportunities] = await Promise.all([repository.getOrganization(organizationId), repository.listOpportunities({ organizationId })]);
  return <main className="page-shell"><p className="eyebrow">Provider desk</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-black">{organization?.name}</h1><p className="mt-2 text-ink/60">Share clear opportunities. We will take care of the trust queue.</p></div><Link href="/dashboard/opportunities/new" className="button">Post an opportunity</Link></div><nav className="mt-6 flex flex-wrap gap-2" aria-label="Provider tools"><Link className="button-secondary" href="/dashboard/opportunities">Opportunities</Link><Link className="button-secondary" href="/dashboard/analytics">Analytics</Link><Link className="button-secondary" href="/dashboard/organization">Organization</Link><Link className="button-secondary" href="/dashboard/monetization">Readiness</Link></nav><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="card bg-butter"><p className="text-3xl font-black">{opportunities.length}</p><p className="text-sm font-bold">Total listings</p></div><div className="card"><p className="text-3xl font-black">{opportunities.filter((item) => item.verificationStatus === "verified").length}</p><p className="text-sm font-bold">Verified</p></div><div className="card"><p className="text-3xl font-black">{opportunities.filter((item) => item.verificationStatus === "pending").length}</p><p className="text-sm font-bold">Awaiting review</p></div></div></main>;
}
