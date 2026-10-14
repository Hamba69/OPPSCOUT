import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalAuth } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function OrganizationSignupPage(): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (auth?.role === "organization") redirect("/dashboard");
  return <main className="page-shell animate-in"><div className="mx-auto max-w-2xl text-center"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Create a publisher account</h1><p className="mt-3 text-navy">{auth?.role === "user" ? "You are signed in with a personal account, which cannot be converted. Sign out and use a different email address to set up opportunity publishing." : "Set up a separate account to submit and manage opportunities. Publisher details are reviewed before listings can be published."}</p></div>{auth?.role === "user" && <form action="/auth/logout" method="post" className="mt-6 text-center"><input type="hidden" name="next" value="/organizations/signup" /><button className="button">Sign out</button></form>}{!auth && <AuthForm nextPath="/onboarding/organization" initialMode="signup" />}<p className="mt-6 text-center text-sm text-navy">Already registered? <Link className="font-bold underline" href="/organizations/login">Log in here.</Link></p></main>;
}