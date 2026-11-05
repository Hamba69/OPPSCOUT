import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getOptionalAuth, homePathForRole } from "@/lib/auth";

import { AdminPortalTrigger } from "@/components/admin-portal-trigger";

export const dynamic = "force-dynamic";

const wrap = "mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8";

const steps = [
  ["You tell us what you're looking for", "Share your study field, skills and opportunity preferences. A few minutes is enough."],
  ["We check the gate first", "Eligibility comes before ranking. If the opportunity doesn't meet your criteria, it never reaches your feed, so you never waste time."],
  ["Meet your matches", "Every match explains why it fits and what to prepare, and links to the official source so you can apply safely."],
] as const;

// Soft gold glow in the top-right corner and a faint green wash on the left. Static, no animation.
const glow = "radial-gradient(ellipse 45% 55% at 88% 0%, rgba(255,215,0,0.30), transparent 70%), radial-gradient(ellipse 40% 40% at 8% 60%, rgba(31,126,110,0.07), transparent 70%)";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ unlock?: string }> }): Promise<React.JSX.Element> {
  const unlock = (await searchParams).unlock === "1";
  const auth = await getOptionalAuth();
  if (auth && !unlock) redirect(homePathForRole(auth.role));
  return (
    <main className="relative overflow-x-clip">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-20 h-[760px]" style={{ backgroundImage: glow }} />
      <div className="relative">
        <section className="mx-auto max-w-3xl px-4 pt-10 text-center sm:px-6 sm:pt-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3.5 py-1.5 text-[13px] font-semibold tracking-[0.08em] text-ink">
            <span className="size-1.5 rounded-full bg-amber" aria-hidden="true" />MEET YOUR OPPORTUNITIES
          </span>
          <h1 className="hero-title mx-auto mt-7 max-w-3xl tracking-tight text-ink">The right opportunity is already out there.</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-navy sm:text-[17px]">Find the opportunities before they close.</p>
        </section>

        <section aria-hidden="true" className="flex justify-center pt-12 sm:pt-16">
          <div className="grid size-[132px] place-items-center rounded-[36px] border border-ink/[.08] bg-white shadow-[0_16px_48px_rgba(30,41,59,0.12),0_0_90px_rgba(255,215,0,0.38)]">
            <Image src="/logo.png" alt="" width={88} height={88} priority />
          </div>
        </section>

        <section aria-labelledby="how-it-works" className={`${wrap} pt-20 sm:pt-24`}>
          <h2 id="how-it-works" className="text-center text-3xl font-bold text-ink">How OppScout works</h2>
          
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(([title, text], index) => <li key={title} className="rounded-[18px] border border-ink/10 bg-white p-6">
              <span className="grid size-8 place-items-center rounded-full bg-amber font-bold text-ink" aria-hidden="true">{index + 1}</span>
              <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-navy">{text}</p>
            </li>)}
          </ol>
        </section>

        <section aria-labelledby="trust-promises" className={`${wrap} pt-16 sm:pt-[72px]`}>
          <div className="rounded-[20px] border border-leaf/25 bg-leaf/[.06] p-6 sm:p-8">
            <p id="trust-promises" className="text-2xl font-bold text-ink">Let us make your next step feel safe.</p>
          </div>
        </section>

        <footer className={`${wrap} mt-16 pb-10 text-sm text-navy`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-6">
            <AdminPortalTrigger initiallyOpen={unlock} />
            <Link href="/organizations" className="inline-flex min-h-11 items-center font-semibold text-ink underline">Post an opportunity</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
