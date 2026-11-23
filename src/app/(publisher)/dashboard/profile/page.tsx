import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/app-shell";
import { getPageUserEmail, requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Publisher profile" };

/** The publisher's account page. Switching to finding opportunities is here, not in the menu. */
export default async function PublisherProfilePage(): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user", "organization", "admin"]);
  const [email, postings] = await Promise.all([
    getPageUserEmail(),
    (await getRepository()).listOpportunities({ submittedBy: userId }),
  ]);
  const live = postings.filter((item) => item.verificationStatus === "verified" && (item.status === "open" || item.status === "closing_soon")).length;
  const waiting = postings.filter((item) => item.verificationStatus === "pending").length;
  return <main className="animate-in flex flex-col gap-6">
    <header className="title-card"><h1>Publisher profile</h1></header>
    <div className="grid gap-4 md:grid-cols-2">
      <section className="surface" aria-labelledby="publisher-account">
        <h2 id="publisher-account" className="surface-title">Account</h2>
        <p className="mt-3 text-sm font-semibold text-ink">{email ?? "Your signed-in account"}</p>
        <p className="mt-1 text-[13px] text-navy">{postings.length} posting{postings.length === 1 ? "" : "s"} · {live} live · {waiting} in review</p>
        <form action="/auth/logout" method="post" className="mt-4"><button className="button-secondary"><Icon name="signOut" size={15} strokeWidth={2.2} />Sign out</button></form>
      </section>
      <section className="surface" aria-labelledby="publisher-security">
        <h2 id="publisher-security" className="surface-title">Sign-in and security</h2>
        <p className="mt-3 text-[13px] leading-6 text-navy">Use a strong password you don&apos;t use anywhere else.</p>
        <Link href="/reset-password?returnTo=%2Fdashboard%2Fprofile" className="button-secondary mt-4">Change password</Link>
      </section>
    </div>
    <section className="surface" aria-labelledby="publisher-contact">
      <h2 id="publisher-contact" className="surface-title">How reviewers reach you</h2>
      <p className="mt-3 text-[13px] leading-6 text-navy">Each posting carries the name, phone number and email you enter on it. Our review team may call, email or WhatsApp you on those before publishing. Only the review team sees them.</p>
    </section>
    <section className="surface" aria-labelledby="switch-mode">
      <h2 id="switch-mode" className="surface-title">Looking for opportunities yourself?</h2>
      <p className="mt-3 text-[13px] leading-6 text-navy">Use the same account to get matched to jobs, scholarships and more.</p>
      <Link href="/feed" className="button-secondary mt-4">Switch to finding opportunities</Link>
    </section>
    <p className="text-xs text-navy">How we use your data: <Link className="underline" href="/privacy">Privacy Policy</Link> · <Link className="underline" href="/terms">Terms of Use</Link></p>
  </main>;
}
