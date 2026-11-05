import Link from "next/link";
import { redirect } from "next/navigation";

import { PublisherAuthForm } from "@/components/publisher-auth-form";
import { getOptionalAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrganizationSignupPage(): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (auth?.role === "organization") redirect("/dashboard");
  const hours = process.env.OPPSCOUT_MAX_TRUST_TURNAROUND_HOURS ?? "48";
  return <main className="publisher-bg page-shell animate-in">
    <section className="publisher-card">
      <span className="publisher-pill">Publisher account</span>
      <h1>Create a publisher account</h1>
      <p className="publisher-sub">Submit and manage opportunities for your organization.</p>
      {auth?.role === "user"
        ? <>
          <p className="mt-5 rounded-xl border border-leaf/30 bg-leaf/[.07] p-4 text-sm font-bold leading-snug text-leaf">You are signed in with a personal account, which cannot be converted. Sign out and use a different email address to set up opportunity publishing.</p>
          <form action="/auth/logout" method="post" className="mt-6"><input type="hidden" name="next" value="/organizations/signup" /><button className="publisher-submit">Sign out</button></form>
        </>
        : <>
          <p className="mt-5 rounded-xl border border-leaf/30 bg-leaf/[.07] p-4 text-sm font-bold leading-snug text-leaf">This is separate from a personal account. Use an email address that isn’t already registered on OppScout.</p>
          <PublisherAuthForm mode="signup" nextPath="/onboarding/organization" />
          <div className="mt-6 rounded-2xl bg-cream p-4">
            <h2 className="text-sm font-bold text-ink">What happens next</h2>
            <ol className="mt-3 space-y-3 text-sm text-navy">
              <li className="flex items-center gap-3"><span className="publisher-step">1</span>Tell us about your organization.</li>
              <li className="flex items-center gap-3"><span className="publisher-step">2</span>We review it, usually within {hours} hours.</li>
              <li className="flex items-center gap-3"><span className="publisher-step">3</span>Submit your first opportunity.</li>
            </ol>
          </div>
        </>}
      <p className="publisher-divider">Already registered? <Link href="/organizations/login">Log in</Link></p>
    </section>
  </main>;
}
