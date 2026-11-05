import Link from "next/link";
import { redirect } from "next/navigation";

import { PublisherAuthForm } from "../../../../components/publisher-auth-form";
import { getOptionalAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrganizationLoginPage(): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (auth?.role === "organization") redirect("/dashboard");
  return <main className="publisher-bg page-shell animate-in">
    <section className="publisher-card">
      <span className="publisher-pill">Publisher login</span>
      <h1>Log in</h1>
      <p className="publisher-sub">Manage your listings and matched people.</p>
      {auth?.role === "user" && <p className="mt-5 rounded-xl border border-leaf/30 bg-leaf/[.07] p-4 text-sm font-bold leading-snug text-leaf">Use the same email and password for your personal and publisher access.</p>}
      {auth
        ? auth.role === "user"
          ? <Link href="/onboarding/organization" className="publisher-submit mt-6 inline-flex items-center justify-center">Continue with this account</Link>
          : <form action="/auth/logout" method="post" className="mt-6"><button className="publisher-submit">Sign out</button></form>
        : <PublisherAuthForm mode="login" nextPath="/dashboard" />}
      <p className="publisher-divider">New organization? <Link href="/organizations/signup">Create a publisher account</Link></p>
    </section>
    <p className="publisher-footnote">Looking for opportunities? <Link href="/login">Go to OppScout</Link></p>
  </main>;
}
