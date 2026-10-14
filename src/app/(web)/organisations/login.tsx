import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getOptionalAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrganizationLoginPage(): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (auth?.role === "organization") redirect("/dashboard");
  return <main className="page-shell animate-in"><div className="mx-auto max-w-2xl text-center"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Publisher account login</h1><p className="mt-3 text-navy">{auth?.role === "user" ? "You are signed in with a personal account. Sign out, then use your publisher account to manage opportunity listings." : "Sign in to manage your opportunity listings and matched people."}</p></div>{auth ? <form action="/auth/logout" method="post" className="mt-6 text-center"><input type="hidden" name="next" value="/organizations/login" /><button className="button">Sign out</button></form> : <AuthForm nextPath="/dashboard" />}<p className="mt-6 text-center text-sm text-navy">New here? <Link className="font-bold underline" href="/organizations/signup">Set up a posting account.</Link></p></main>;
}