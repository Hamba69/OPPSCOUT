import { AuthForm } from "@/components/auth-form";

interface LoginPageProps { searchParams: Promise<{ next?: string }> }

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.JSX.Element> {
  const requested = (await searchParams).next;
  const nextPath = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/feed";
  return <main className="page-shell"><div className="text-center"><p className="eyebrow">Welcome to OppScout</p><h1 className="mt-2 text-4xl font-black">Your opportunities stay private.</h1><p className="mx-auto mt-3 max-w-xl text-ink/60">Sign in to build your profile, see eligibility-checked matches, and save your next steps.</p></div><AuthForm nextPath={nextPath} /></main>;
}
