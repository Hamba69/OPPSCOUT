import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalAuth } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function OrganizationSignupPage(): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (auth?.role === "organization") redirect("/dashboard");
  return <main className="page-shell animate-in"><div className="mx-auto max-w-2xl text-center"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Create a publisher account</h1><p className="mt-3 text-navy">Sign up to publish and manage opportunities.</p></div>{auth && <p className="mx-auto mt-5 max-w-xl rounded-xl border border-leaf/30 bg-leaf/[.07] p-4 text-sm font-bold leading-snug text-leaf">Your personal and publisher access use the same email and password. Sign in with those credentials on either page.</p>}{auth?.role === "user" ? <div className="mt-6 flex flex-col items-center justify-center gap-3"><Link href="/onboarding/organization" className="button">Continue with this account</Link><form action="/auth/logout" method="post"><input type="hidden" name="next" value="/organizations/signup" /><button className="button secondary">Sign out</button></form></div> : !auth && <AuthForm nextPath="/onboarding/organization" initialMode="signup" />}<p className="mt-6 text-center text-sm text-navy">Already registered? <Link className="font-bold underline" href="/organizations/login">Log in here.</Link></p></main>;
}