import { parseAdminQuery } from "@/lib/admin-data";
import type { Organization, Opportunity } from "@/core/entities/domain";
import Link from "next/link";
import { AdminHeader, ChipLinks } from "@/components/admin-header";
import { OrganizationReviewCard } from "@/components/organization-review-card";
import { ReviewCard } from "@/components/review-card";
import { requireAdminPortal } from "@/lib/admin-portal";
import { getRepository } from "@/lib/repository";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { choiceLabel } from "@/services/profile/choices";
import { formatDate } from "@/lib/dates";
import { isPublisherOrganization } from "@/services/admin/catalogue-summary";

export const dynamic = "force-dynamic";

type Flag = "new" | "link";
const FLAG_LABEL: Record<Flag, string> = { new: "New submission", link: "Link mismatch" };

const hostOf = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try { return new URL(value.includes("://") ? value : `https://${value}`).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; }
};

/** A link mismatch is an apply link outside the organization's official website or email domain. */
function flagFor(item: Opportunity, organization: Organization | null): Flag {
  const source = hostOf(item.sourceUrl);
  const official = [...(organization?.officialLinks ?? []).map(hostOf), organization?.officialEmail?.split("@")[1]?.toLowerCase() ?? null].filter((host): host is string => Boolean(host));
  if (source && official.length && !official.some((host) => source === host || source.endsWith(`.${host}`))) return "link";
  return "new";
}

const day = (value: Date | string | null | undefined): string => value ? formatDate(value, { day: "numeric", month: "short" }) : "—";

function FlagPill({ flag }: { flag: Flag }): React.JSX.Element {
  const tone = flag === "new" ? "text-[#6B4E00] bg-[#FFF3C4]" : "text-[#9B1C1C] bg-[rgba(220,38,38,.08)]";
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{FLAG_LABEL[flag]}</span>;
}

function StatusPill({ status }: { status: string }): React.JSX.Element {
  const flagged = status === "flagged";
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${flagged ? "text-[#9B1C1C] bg-[rgba(220,38,38,.08)]" : "text-[#6B4E00] bg-[#FFF3C4]"}`}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{flagged ? "Flagged" : status}</span>;
}

const th = "px-4 pb-3 text-left text-[11px] font-bold uppercase tracking-[.06em] text-[#5B6A80]";
const td = "border-t border-ink/[.07] px-4 py-3.5 align-middle text-[13px] text-ink";

export default async function ReviewQueuePage({searchParams}:{searchParams:Promise<Record<string,string>>}): Promise<React.JSX.Element> {
  await requireAdminPortal();
  const repository = await getRepository();
  const raw = await searchParams;
  const tab = raw.tab === "organizations" ? "organizations" : "opportunities";
  const flagFilter = (["new", "link"] as const).find((value) => value === raw.flag) ?? "all";
  const page = Math.max(1, Number(raw.page ?? 1) || 1);
  const reviewing = raw.review ?? null;

  // Flagged records have already been decided and are not part of the active review queue.
  const search = (raw.search ?? "").trim();
  const query = (status: string): URLSearchParams => new URLSearchParams({
    verificationStatus: status,
    status: "open",
    page: String(page),
    ...(search ? { search } : {}),
  });
  const [pendingListings, organizationQueue] = await Promise.all([
    repository.adminPage("opportunities", parseAdminQuery("opportunities", query("pending"))),
    repository.listOrganizationReviewQueue(),
  ]);
  const listings = pendingListings.rows as unknown as Opportunity[];
  // Only organisations that signed up in the app need verification. Providers created by seeding
  // are trusted through each listing's own review, so they never wait in this queue.
  const publisherQueue = organizationQueue
    .filter(isPublisherOrganization)
    .filter((organization) => !search || organization.name.toLowerCase().includes(search.toLowerCase()));
  const organizations: Organization[] = publisherQueue.slice((page - 1) * 25, page * 25);
  const listingTotal = pendingListings.total;
  const organizationTotal = publisherQueue.length;

  const publishers = new Map<string, Organization | null>();
  await Promise.all([...new Set(listings.map((item) => item.organizationId).filter((id): id is string => Boolean(id)))].map(async (id) => { publishers.set(id, await repository.getOrganization(id)); }));
  const rows = listings.map((item) => ({ item, flag: flagFor(item, item.organizationId ? publishers.get(item.organizationId) ?? null : null) }));
  const visibleRows = flagFilter === "all" ? rows : rows.filter((row) => row.flag === flagFilter);

  const dashboardUsers = [...new Set([...organizations, ...publisherQueue.filter((item) => item.id === reviewing)].flatMap((item) => item.dashboardUsers))];
  const proofQuery = dashboardUsers.length
    ? await createServiceRoleClient().from("StoredDocument").select("id,ownerId,createdAt").eq("ownerType","user").eq("purpose","registration_proof").eq("status","ready").in("ownerId",dashboardUsers).order("createdAt",{ascending:false})
    : { data: [], error: null };
  if (proofQuery.error) throw new Error(`Could not load URSB registration proof documents: ${proofQuery.error.message}`);
  const proofByUser = new Map<string,string>();
  for (const proof of proofQuery.data ?? []) if (!proofByUser.has(proof.ownerId)) proofByUser.set(proof.ownerId,proof.id);

  const href = (changes: Record<string, string | null>): string => {
    const next = new URLSearchParams({ tab, flag: flagFilter, page: String(page) });
    if (search) next.set("search", search);
    for (const [key, value] of Object.entries(changes)) { if (value === null) next.delete(key); else next.set(key, value); }
    if (next.get("flag") === "all") next.delete("flag");
    if (next.get("page") === "1") next.delete("page");
    return `?${next.toString()}`;
  };
  const pages = Math.max(1, Math.ceil(Math.max(pendingListings.total, organizationTotal) / 25));
  const openListing = tab === "opportunities" && reviewing ? listings.find((item) => item.id === reviewing) : undefined;
  const openOrganization = tab === "organizations" && reviewing ? publisherQueue.find((item) => item.id === reviewing) : undefined;

  return <main className="animate-in flex min-w-0 flex-col gap-6">
    <AdminHeader title="Review queue" subtitle="Approve or reject listings, and verify organisations that signed up to post.">
      <ChipLinks label="Review type" current={tab} options={[["opportunities", `Opportunities · ${listingTotal}`], ["organizations", `Publishers · ${organizationTotal}`]]} href={(value) => href({ tab: value, flag: null, page: null, review: null })} />
    </AdminHeader>

    <form action="/admin/review" method="get" role="search" className="surface flex flex-wrap items-end gap-3">
      <input type="hidden" name="tab" value={tab} />
      <input type="hidden" name="flag" value={flagFilter} />
      <label className="min-w-[220px] flex-1 text-sm font-semibold text-navy">
        Search review queue
        <input
          className="field mt-1"
          type="search"
          name="search"
          defaultValue={raw.search ?? ""}
          maxLength={200}
          placeholder="Organization or opportunity name"
        />
      </label>
      <button className="button">Search</button>
      {search && <Link className="button-secondary" href={href({ search: null, page: null, review: null })}>Clear search</Link>}
    </form>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="section-title">{tab === "opportunities" ? listingTotal : organizationTotal} waiting for a decision</h2>
      {tab === "opportunities" && <ChipLinks label="Filter by flag" current={flagFilter} options={[["all", "All"], ["new", "New submissions"], ["link", "Link mismatch"]]} href={(value) => href({ flag: value, page: null, review: null })} />}
    </div>

    {(openListing || openOrganization) && <section aria-label="Review details" className="surface flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3"><h2 className="surface-title">Reviewing {openListing?.title ?? openOrganization?.name}</h2><Link href={href({ review: null })} className="button-secondary">Close</Link></div>
      {openListing && <ReviewCard id={openListing.id} title={openListing.title} organization={openListing.organization?.name ?? openListing.organizationName ?? "Unknown organization"} sourceUrl={openListing.sourceUrl} status={openListing.verificationStatus} description={openListing.description} category={choiceLabel(openListing.category)} location={openListing.location} deadline={openListing.deadline ? new Date(openListing.deadline).toISOString() : null} applicationMethod={openListing.applicationMethod} reviewNotes={openListing.reviewNotes} />}
      {openOrganization && <OrganizationReviewCard id={openOrganization.id} name={openOrganization.name} sector={openOrganization.sector} officialLinks={openOrganization.officialLinks} officialEmail={openOrganization.officialEmail} registrationProof={openOrganization.registrationProof} registrationProofDocumentId={openOrganization.dashboardUsers.map((userId) => proofByUser.get(userId)).find(Boolean) ?? null} accountableContact={openOrganization.accountableContact} accountableContacts={openOrganization.accountableContacts} additionalAccountableContact={openOrganization.additionalAccountableContact} additionalAccountableContactPhone={openOrganization.additionalAccountableContactPhone} status={openOrganization.verificationStatus} />}
    </section>}

    {tab === "opportunities" ? <section aria-labelledby="review-opportunities" className="surface">
      <h2 id="review-opportunities" className="surface-title mb-4">Opportunities</h2>
      {visibleRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] table-fixed border-collapse">
        <colgroup><col className="w-[30%]" /><col className="w-[16%]" /><col className="w-[20%]" /><col className="w-[18%]" /><col className="w-[16%]" /></colgroup>
        <thead><tr><th scope="col" className={th}>Listing</th><th scope="col" className={th}>Type</th><th scope="col" className={th}>Flag</th><th scope="col" className={th}>Submitted</th><th scope="col" className={th}><span className="sr-only">Action</span></th></tr></thead>
        <tbody>{visibleRows.map(({ item, flag }) => <tr key={item.id}>
          <td className={td}><strong className="block truncate font-bold">{item.title}</strong><span className="block truncate text-xs text-navy">{item.organization?.name ?? item.organizationName ?? "Unknown organization"}</span></td>
          <td className={td}><span className="cat-pill">{choiceLabel(item.category)}</span></td>
          <td className={td}><FlagPill flag={flag} /></td>
          <td className={td}>Submitted {day(item.publicationDate)}</td>
          <td className={td}><Link href={href({ review: item.id })} className="button !min-h-10 !px-5" aria-label={`Review ${item.title}`}>Review</Link></td>
        </tr>)}</tbody>
      </table></div> : <QueueClear title="Opportunity queue clear" text="Every current listing has a decision. New submissions will appear here for your next review." />}
    </section> : <section aria-labelledby="review-organizations" className="surface">
      <h2 id="review-organizations" className="surface-title mb-4">Publishers</h2>
      {organizations.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] table-fixed border-collapse">
        <colgroup><col className="w-[34%]" /><col className="w-[18%]" /><col className="w-[16%]" /><col className="w-[16%]" /><col className="w-[16%]" /></colgroup>
        <thead><tr><th scope="col" className={th}>Organization</th><th scope="col" className={th}>Sector</th><th scope="col" className={th}>Status</th><th scope="col" className={th}>Submitted</th><th scope="col" className={th}><span className="sr-only">Action</span></th></tr></thead>
        <tbody>{organizations.map((item) => <tr key={item.id}>
          <td className={td}><strong className="block truncate font-bold">{item.name}</strong><span className="block truncate text-xs text-navy">{item.officialEmail ?? item.officialLinks[0] ?? "No official contact yet"}</span></td>
          <td className={td}><span className="cat-pill">{item.sector || "—"}</span></td>
          <td className={td}><StatusPill status={item.verificationStatus} /></td>
          <td className={td}>Submitted {day(item.createdAt)}</td>
          <td className={td}><Link href={href({ review: item.id })} className="button !min-h-10 !px-5" aria-label={`Review ${item.name}`}>Review</Link></td>
        </tr>)}</tbody>
      </table></div> : <QueueClear title="Publisher queue clear" text="Every organisation that signed up to post has a decision. Providers added by seeding never need verification here." />}
    </section>}

    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Review pages">
      <span className="text-[13px] text-navy">Page {page} of {pages}</span>
      <div className="flex gap-2">
        {page > 1 ? <Link className="button-secondary" href={href({ page: String(page - 1), review: null })}>Previous</Link> : <span className="button-secondary opacity-50" aria-disabled="true">Previous</span>}
        {page < pages ? <Link className="button-secondary" href={href({ page: String(page + 1), review: null })}>Next</Link> : <span className="button-secondary opacity-50" aria-disabled="true">Next</span>}
      </div>
    </nav>
  </main>;
}

function QueueClear({ title, text }: { title: string; text: string }): React.JSX.Element {
  return <div className="py-8 text-center">
    <div className="flex justify-center"><span className="orb block size-14" aria-hidden="true" /></div>
    <h3 className="mt-4 text-xl font-extrabold text-ink">{title}</h3>
    <p className="mx-auto mt-2 max-w-lg text-sm text-navy">{text}</p>
    <Link href="/admin/slo" className="button mt-5">Check system health</Link>
  </div>;
}
