import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const steps = [
  ["01", "Create an account", "Sign up or sign in to keep your matches and saved opportunities private."],
  ["02", "Add your profile", "Share your study field, skills, and preferred locations so we can find a useful fit."],
  ["03", "Explore your matches", "See what fits, save promising options, and follow each official source."],
] as const;

const promises = [
  ["Every listing checked", "Official sources, plausible deadlines, and duplicate checks before a listing reaches your feed."],
  ["No application fees", "We check for inappropriate fees and unnecessary requests for sensitive information."],
  ["Sources always linked", "Go straight to the official listing. Report anything suspicious for a fresh review."],
] as const;

export default async function HomePage(): Promise<React.JSX.Element> {
  let signedIn = false;
  let signedInDestination = "/feed";
  let signedInAction = "Open my matches";
  let profileSettingsHref: string | null = "/settings?section=profile";
  try {
    const { data: { user } } = await (await createClient()).auth.getUser();
    signedIn = Boolean(user);
    if (user?.app_metadata.role === "organization") {
      signedInDestination = "/dashboard";
      signedInAction = "Open provider workspace";
      profileSettingsHref = null;
    } else if (user?.app_metadata.role === "admin") {
      signedInDestination = "/admin/kpis";
      signedInAction = "Open admin tools";
      profileSettingsHref = null;
    }
  } catch {
    // The public introduction stays available while authentication is not configured.
  }

  return (
    <main className="page-shell animate-in">
      <div className="grid items-center gap-10 py-6 lg:grid-cols-[1.2fr_.8fr] lg:py-10">
        <section>
          <p className="eyebrow">Your next good thing</p>
          <h1 className="mt-3 max-w-3xl text-5xl font-black leading-[1.02] sm:text-7xl">Good opportunities, minus the guesswork.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">OppScout checks eligibility first, ranks what genuinely fits, and tells you exactly why.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={signedIn ? signedInDestination : "/login?mode=signup&next=%2Ffeed"} className="button">{signedIn ? signedInAction : "Create my account"}</Link>
            {profileSettingsHref && <Link href={signedIn ? profileSettingsHref : "/login?next=%2Ffeed"} className="button-secondary">{signedIn ? "Update my profile" : "I already have an account"}</Link>}
          </div>
        </section>
        <aside className="card relative overflow-hidden bg-butter">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-sun" />
          <div className="relative">
            <svg viewBox="0 0 64 64" className="size-14 text-leaf" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M32 54V29M32 40C14 41 10 31 12 20c13 0 22 6 20 20ZM32 30C32 13 42 8 54 10c1 14-7 21-22 20Z" /><path d="M20 54h24" /></svg>
            <p className="mt-5 text-xs font-black uppercase tracking-wider text-leaf">An explained match</p>
            <p className="score-enter mt-2 text-3xl font-black">Know why it fits</p>
            <p className="mt-2 font-bold">Your skills. Your next step.</p>
            <ul className="mt-5 space-y-3 text-sm leading-6">
              <li><span className="mr-2 font-black text-leaf" aria-hidden="true">✓</span>Eligibility checked before ranking</li>
              <li><span className="mr-2 font-black text-leaf" aria-hidden="true">✓</span>Clear reasons behind every match</li>
              <li><span className="mr-2 font-black" aria-hidden="true">△</span>See what to prepare before applying</li>
            </ul>
          </div>
        </aside>
      </div>
      <section className="mt-10 border-t border-ink/10 pt-8" aria-labelledby="how-it-works">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 id="how-it-works" className="text-2xl font-black">A clearer path to what’s next.</h2><p className="text-sm text-ink/55">Three steps. All yours.</p></div>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">{steps.map(([number, title, description]) => <li key={number} className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sun text-xs font-black" aria-hidden="true">{number}</span>
          <div><h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-ink/65">{description}</p></div>
        </li>)}</ol>
      </section>
      <section className="card mt-10 bg-leaf/5" aria-labelledby="trust-promises">
        <p className="eyebrow">Trust, in plain language</p><h2 id="trust-promises" className="mt-2 text-2xl font-black">Your next step should feel safe.</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">{promises.map(([title, description]) => <div key={title}>
          <svg viewBox="0 0 24 24" className="mb-3 size-6 text-leaf" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></svg>
          <h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-ink/65">{description}</p>
        </div>)}</div>
      </section>
      <p className="mt-8 text-center text-sm text-ink/60">Represent an organization? <Link className="font-bold underline underline-offset-4" href="/onboarding/organization">Set up a provider workspace</Link></p>
    </main>
  );
}
