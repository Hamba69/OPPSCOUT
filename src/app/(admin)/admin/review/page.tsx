import { parseAdminQuery } from "@/lib/admin-data";
import type { Organization, Opportunity } from "@/core/entities/domain";
import Link from "next/link";
import { OrganizationReviewCard } from "@/components/organization-review-card";
import { ReviewCard } from "@/components/review-card";
import { requireAdminPortal } from "@/lib/admin-portal";
import { getRepository } from "@/lib/repository";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage({searchParams}:{searchParams:Promise<Record<string,string>>}): Promise<React.JSX.Element> {
  await requireAdminPortal();
  const repository = await getRepository();
  const params=new URLSearchParams(await searchParams);if(!params.has("verificationStatus"))params.set("verificationStatus","pending");params.set("status","open");
  const [listings,orgs]=await Promise.all([repository.adminPage("opportunities",parseAdminQuery("opportunities",params)),repository.adminPage("organizations",parseAdminQuery("organizations",params))]);
  const queue=listings.rows as unknown as Opportunity[],organizations=orgs.rows as unknown as Organization[];
  const dashboardUsers = [...new Set(organizations.flatMap((item) => item.dashboardUsers))];
  const proofQuery = dashboardUsers.length
    ? await createServiceRoleClient().from("StoredDocument").select("id,ownerId,createdAt").eq("ownerType","user").eq("purpose","registration_proof").eq("status","ready").in("ownerId",dashboardUsers).order("createdAt",{ascending:false})
    : { data: [], error: null };
  if (proofQuery.error) throw new Error(`Could not load URSB registration proof documents: ${proofQuery.error.message}`);
  const proofByUser = new Map<string,string>();
  for (const proof of proofQuery.data ?? []) if (!proofByUser.has(proof.ownerId)) proofByUser.set(proof.ownerId,proof.id);
  const page=Number(params.get("page")??1);

  return (
    <main className="min-w-0 flex-1 animate-in">
      <header className="title-card !w-full">
        <h1>Review queue</h1>
      </header>
      <form className="surface flex flex-wrap items-end gap-3">
        <label className="text-sm font-semibold text-navy">
          Status
          <select name="verificationStatus" className="field" defaultValue={params.get("verificationStatus") ?? "pending"}>
            {["pending", "flagged", "unverified", "verified"].map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <button className="button-secondary">Filter</button>
      </form>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
        <section className="surface min-w-0" aria-labelledby="organizations-review-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 id="organizations-review-heading" className="text-xl font-bold text-ink">Organizations</h2>
            <span className="pill">{orgs.total.toLocaleString()}</span>
          </div>
          <div className="mt-4 grid gap-4">
            {organizations.length ? organizations.map((item) => (
              <OrganizationReviewCard
                key={item.id}
                id={item.id}
                name={item.name}
                sector={item.sector}
                officialLinks={item.officialLinks}
                officialEmail={item.officialEmail}
                registrationProof={item.registrationProof}
                registrationProofDocumentId={item.dashboardUsers.map((userId) => proofByUser.get(userId)).find(Boolean) ?? null}
                accountableContact={item.accountableContact}
                accountableContacts={item.accountableContacts}
                additionalAccountableContact={item.additionalAccountableContact}
                additionalAccountableContactPhone={item.additionalAccountableContactPhone}
                status={item.verificationStatus}
              />
            )) : <p className="rounded-xl bg-white/70 p-4 text-sm text-navy">No organizations in this status.</p>}
          </div>
        </section>

        <section className="surface min-w-0" aria-labelledby="opportunities-review-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 id="opportunities-review-heading" className="text-xl font-bold text-ink">Opportunities</h2>
            <span className="pill">{listings.total.toLocaleString()}</span>
          </div>
          <div className="mt-4 grid gap-4">
            {queue.length ? queue.map((item) => (
              <ReviewCard
                key={item.id}
                id={item.id}
                title={item.title}
                organization={item.organization?.name ?? item.organizationName ?? "Unknown organization"}
                sourceUrl={item.sourceUrl}
                status={item.verificationStatus}
                description={item.description}
                reviewNotes={item.reviewNotes}
              />
            )) : <p className="rounded-xl bg-white/70 p-4 text-sm text-navy">No opportunities in this status.</p>}
          </div>
        </section>
      </div>

      <nav className="mt-5 flex justify-between" aria-label="Review pages">
        {page > 1 ? <Link className="button-secondary" href={`?verificationStatus=${params.get("verificationStatus")}&page=${page - 1}`}>Previous</Link> : <span />}
        {page * 25 < Math.max(listings.total, orgs.total)
          ? <Link className="button-secondary" href={`?verificationStatus=${params.get("verificationStatus")}&page=${page + 1}`}>Next</Link>
          : <span />}
      </nav>
    </main>
  );
}
