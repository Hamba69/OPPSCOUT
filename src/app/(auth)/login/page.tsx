import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface LoginPageProps { searchParams: Promise<{ next?: string; error?: string; mode?: string }> }

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.JSX.Element> {
  const { next: requested, error, mode } = await searchParams;
  let nextPath = requested?.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\") ? requested : "/feed";
  let signedIn = false;
  try {
    const { data: { user } } = await (await createClient()).auth.getUser();
    signedIn = Boolean(user);
    if (!requested && user?.app_metadata.role === "organization") nextPath = "/dashboard";
    if (!requested && user?.app_metadata.role === "admin") nextPath = "/admin/kpis";
  } catch {
    // The form displays its own configuration message when auth is unavailable.
  }
  if (signedIn) redirect(nextPath);
  return <main className="page-shell animate-in"><div className="text-center"><p className="eyebrow">Step 1 · Your account</p><h1 className="mt-2 text-4xl font-black">Start with your account.</h1><p className="mx-auto mt-3 max-w-xl text-ink/60">Create a free account or sign in. New members will add a short profile before seeing their matches.</p></div>{error === "callback" && <p className="mx-auto mt-6 max-w-lg rounded-2xl bg-butter p-3 text-sm font-bold" role="alert">Your email link is invalid or has expired. To reset your password, enter your email below and choose “Forgot your password?”.</p>}<AuthForm nextPath={nextPath} initialMode={mode === "signup" ? "signup" : "signin"} /></main>;
}
