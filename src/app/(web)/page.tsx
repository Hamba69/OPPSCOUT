import Link from "next/link";
import { redirect } from "next/navigation";

import { getOptionalAuth, homePathForRole } from "@/lib/auth";

import { AdminPortalTrigger } from "@/components/admin-portal-trigger";
import { Icon } from "@/components/app-shell";
import { CategoryArtwork } from "@/components/category-artwork";

export const dynamic = "force-dynamic";

const steps = [
  ["search", "Build your profile", "Add your studies, skills and the opportunity types you want."],
  ["check", "Get verified matches", "Every listing is checked before it reaches you, and ranked by fit."],
  ["clock", "Apply before it closes", "Save what fits and get reminded before deadlines."],
] as const;

const tiles = [
  ["job", "Jobs", "job"],
  ["scholarship", "Scholarships", "scholarship"],
  ["internship", "Internships", "internship"],
  ["grant", "Grants", "grant"],
] as const;

export default async function HomePage({ searchParams }: { searchParams: Promise<{ unlock?: string }> }): Promise<React.JSX.Element> {
  const unlock = (await searchParams).unlock === "1";
  const auth = await getOptionalAuth();
  if (auth && !unlock) redirect(homePathForRole(auth.role));
  return (
    <main className="mx-auto flex w-full max-w-[74rem] flex-col gap-7 px-4 pb-10 pt-4 sm:px-6">
      <section className="greeting !rounded-[2rem] !px-6 !py-14 sm:!px-10 sm:!py-16">
        <div className="orb size-[4.75rem]" aria-hidden="true" />
        <h1 className="hero-title !m-0 !max-w-3xl !font-extrabold !tracking-tight">The right opportunity is already out there.</h1>
      </section>

      <div className="tile-grid-wrap"><nav aria-label="Browse by type" className="tile-grid">
        {tiles.map(([type, label, icon]) => <Link key={type} href={`/opportunities?type=${type}`} className="tile !min-h-[6.875rem]">
          <CategoryArtwork category={icon} />{label}
        </Link>)}
      </nav></div>

      <section aria-labelledby="how-it-works" className="flex flex-col gap-5">
        <h2 id="how-it-works" className="mt-3 text-center text-2xl font-extrabold text-ink">How OppScout works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(([icon, title, text]) => <li key={title} className="surface flex flex-col gap-3 !p-[1.375rem]">
            <span className="icon-chip !size-11 !rounded-[14px]"><Icon name={icon} size={20} /></span>
            <h3 className="text-[17px] font-bold text-ink">{title}</h3>
            <p className="text-sm leading-6 text-navy">{text}</p>
          </li>)}
        </ol>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-white/85 bg-white/60 px-8 py-7 shadow-[0_10px_30px_rgba(146,98,0,0.06)] backdrop-blur-xl">
        <h2 className="text-xl font-extrabold text-ink">Have an opportunity to share?</h2>
        <Link href="/organizations" className="button-dark">Post an opportunity</Link>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-6 text-sm text-navy">
        <AdminPortalTrigger initiallyOpen={unlock} />
      </footer>
    </main>
  );
}
