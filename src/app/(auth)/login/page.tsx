import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

interface LoginPageProps { searchParams: Promise<{ next?: string; error?: string }> }

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.JSX.Element> {
  const { next: requested, error } = await searchParams;
  const nextPath = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/feed";
  return <main className="page-shell animate-in"><div className="text-center"><p className="eyebrow">Welcome to OppScout</p><h1 className="mt-2 text-4xl font-black">Your opportunities stay private.</h1><p className="mx-auto mt-3 max-w-xl text-ink/60">Sign in to build your profile, see eligibility-checked matches, and save your next steps.</p></div>{error === "callback" && <p className="mx-auto mt-6 max-w-lg rounded-2xl bg-butter p-3 text-sm font-bold" role="alert">Your email link is invalid or has expired. To reset your password, enter your email below and choose “Forgot your password?”.</p>}<AuthForm nextPath={nextPath} /></main>;
}
