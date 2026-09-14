import { AuthForm } from "@/components/auth-form";
import Link from "next/link";
import { isMemoryDataMode } from "@/lib/repository";

export const dynamic = "force-dynamic";

interface LoginPageProps { searchParams: Promise<{ next?: string }> }

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.JSX.Element> {
  if (isMemoryDataMode()) {
    const personas = [
      { name: "Opportunity seeker (Amina)", detail: "See ranked, explained matches", href: "/feed", number: "01", color: "bg-butter" },
      { name: "Verified organization (Nile Innovation Hub)", detail: "Post opportunities, watch the trust queue", href: "/dashboard", number: "02", color: "bg-leaf/10" },
      { name: "Platform admin", detail: "Ten KPIs, no guesswork", href: "/admin/kpis", number: "03", color: "bg-coral/10" },
    ];
    return (
      <main className="page-shell animate-in">
        <div className="mx-auto max-w-2xl py-6 text-center">
          <p className="eyebrow">Explore the demo</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Your opportunities stay private.</h1>
          <p className="mt-4 leading-7 text-ink/65">Three perspectives. One next step. Choose a view to explore OppScout, and come back here any time to see the other side.</p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {personas.map((persona) => (
            <Link key={persona.href} href={persona.href} className={`card flex flex-col transition hover:-translate-y-1 hover:border-ink/30 focus-visible:outline focus-visible:outline-4 focus-visible:outline-sun ${persona.color}`}>
              <span className="mb-8 grid size-11 place-items-center rounded-full border border-ink/15 text-sm font-black" aria-hidden="true">{persona.number}</span>
              <h2 className="text-xl font-black">{persona.name}</h2>
              <p className="mb-8 mt-3 text-sm leading-6 text-ink/65">{persona.detail}</p>
              <span className="mt-auto text-sm font-extrabold">Explore this view <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-ink/55">No account needed. Demo changes last for this server session.</p>
      </main>
    );
  }
  const requested = (await searchParams).next;
  const nextPath = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/feed";
  return <main className="page-shell animate-in"><div className="text-center"><p className="eyebrow">Welcome to OppScout</p><h1 className="mt-2 text-4xl font-black">Your opportunities stay private.</h1><p className="mx-auto mt-3 max-w-xl text-ink/60">Sign in to build your profile, see eligibility-checked matches, and save your next steps.</p></div><AuthForm nextPath={nextPath} /></main>;
}
