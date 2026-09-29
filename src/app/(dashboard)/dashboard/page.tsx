import Link from "next/link";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";
export default async function DashboardPage(): Promise<React.JSX.Element> {
  const repository = await getRepository(); const auth = await requirePageAuth(["organization"]); const organizationId = auth.organizationId!;
  const [organization, opportunities] = await Promise.all([repository.getOrganization(organizationId), repository.listOpportunities({ organizationId })]);
  return <main className="page-shell animate-in"><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{organization?.name}</h1><p className="mt-2 text-navy">Post clear opportunities. We handle the verification checks.</p></div><Link href="/dashboard/opportunities/new" className="button">Post an opportunity</Link></div><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="card border-honey bg-butter"><p className="text-3xl font-extrabold text-ink">{opportunities.length}</p><p className="text-sm font-bold text-navy">Total listings</p></div><div className="card"><p className="text-3xl font-extrabold text-leaf">{opportunities.filter((item) => item.verificationStatus === "verified").length}</p><p className="text-sm font-bold text-navy">Verified</p></div><div className="card"><p className="text-3xl font-extrabold text-ink">{opportunities.filter((item) => item.verificationStatus === "pending").length}</p><p className="text-sm font-bold text-navy">Awaiting review</p></div></div></main>;
}
