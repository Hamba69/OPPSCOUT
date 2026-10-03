import { parseAdminQuery } from "@/lib/admin-data";
import type { Organization, Opportunity } from "@/core/entities/domain";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { OrganizationReviewCard } from "@/components/organization-review-card";
import { ReviewCard } from "@/components/review-card";
import { requireAdminPortal } from "@/lib/admin-portal";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage({searchParams}:{searchParams:Promise<Record<string,string>>}): Promise<React.JSX.Element> {
  await requireAdminPortal();
  const repository = await getRepository();
  const params=new URLSearchParams(await searchParams);if(!params.has("verificationStatus"))params.set("verificationStatus","pending");
  const [listings,orgs]=await Promise.all([repository.adminPage("opportunities",parseAdminQuery("opportunities",params)),repository.adminPage("organizations",parseAdminQuery("organizations",params))]);
  const queue=listings.rows as unknown as Opportunity[],organizations=orgs.rows as unknown as Organization[];
  const total=listings.total+orgs.total;
  const page=Number(params.get("page")??1);

  return <main className="page-shell animate-in min-w-0"><form className="flex flex-wrap gap-3"><label>Status<select name="verificationStatus" className="field" defaultValue={params.get("verificationStatus")??"pending"}>{["pending","flagged","unverified","verified"].map(status=><option key={status}>{status}</option>)}</select></label><button className="button-secondary">Filter</button></form><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Review queue</h1><p className="mt-2 text-navy">Organizations and listings both need a verified decision before trust is shown.</p></div><span className="pill">{total} waiting</span></div>{organizations.length > 0 && <section className="mt-8"><h2 className="text-xl font-extrabold text-ink">Organizations</h2><div className="mt-4 grid gap-5 lg:grid-cols-2">{organizations.map((item) => <OrganizationReviewCard key={item.id} id={item.id} name={item.name} sector={item.sector} officialLinks={item.officialLinks} officialEmail={item.officialEmail} registrationProof={item.registrationProof} accountableContact={item.accountableContact} status={item.verificationStatus} />)}</div></section>}<section className="mt-8"><h2 className="text-xl font-extrabold text-ink">Opportunities</h2><div className="mt-4 grid gap-5 lg:grid-cols-2">{queue.length ? queue.map((item) => <ReviewCard key={item.id} id={item.id} title={item.title} organization={item.organization?.name ?? "Unknown organization"} sourceUrl={item.sourceUrl} status={item.verificationStatus} description={item.description} />) : <section className="card border-2 border-honey bg-butter text-center lg:col-span-2"><div className="flex justify-center"><Logo size={56} /></div><h3 className="mt-3 text-xl font-extrabold text-ink">Opportunity queue clear</h3><p className="mt-2 text-navy">Every current listing has a decision. New submissions and reported listings will appear here for your next review.</p><Link href="/admin/slo" className="button mt-5">Check system health</Link></section>}</div></section><nav className="mt-5 flex justify-between" aria-label="Review pages">{page>1&&<Link className="button-secondary" href={`?verificationStatus=${params.get("verificationStatus")}&page=${page-1}`}>Previous</Link>}{page*25<Math.max(listings.total,orgs.total)&&<Link className="button-secondary" href={`?verificationStatus=${params.get("verificationStatus")}&page=${page+1}`}>Next</Link>}</nav></main>;
}
