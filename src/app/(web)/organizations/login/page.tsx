import Link from "next/link";
import { redirect } from "next/navigation";

import { PublisherAuthForm } from "@/components/publisher-auth-form";
import { getOptionalAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrganizationLoginPage(): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (auth?.role === "organization") redirect("/dashboard");
  return <main className="publisher-bg page-shell animate-in">
    <section className="publisher-card">
      <span className="publisher-pill">Publisher login</span>
      <h1>Log in</h1>
      <p className="publisher-sub">{auth?.role === "user" ? "You are signed in with a personal account. Sign out, then use your publisher account to manage opportunity listings." : "Manage your listings and matched people."}</p>
      {auth
        ? <form action="/auth/logout" method="post" className="mt-6"><input type="hidden" name="next" value="/organizations/login" /><button className="publisher-submit">Sign out</button></form>
        : <PublisherAuthForm mode="login" nextPath="/dashboard" />}
      <p className="publisher-divider">New organization? <Link href="/organizations/signup">Create a publisher account</Link></p>
    </section>
    <p className="publisher-footnote">Looking for opportunities? <Link href="/login">Job seeker log in</Link></p>
  </main>;
}
