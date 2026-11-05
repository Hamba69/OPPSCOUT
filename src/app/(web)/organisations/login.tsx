import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getOptionalAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrganizationLoginPage(): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  if (auth?.role === "organization") redirect("/dashboard");
  return <main className="page-shell animate-in"><div className="mx-auto max-w-2xl text-center"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Publisher account login</h1><p className="mt-3 text-navy">Sign in to manage your opportunity listings and matched people.</p></div>{auth?.role === "user" && <p className="mx-auto mt-5 max-w-xl rounded-xl border border-leaf/30 bg-leaf/[.07] p-4 text-sm font-bold leading-snug text-leaf">Use the same email and password for your personal and publisher access.</p>}{auth?.role === "user" ? <div className="mt-6 text-center"><Link href="/onboarding/organization" className="button">Continue with this account</Link></div> : auth ? <form action="/auth/logout" method="post" className="mt-6 text-center"><button className="button">Sign out</button></form> : <AuthForm nextPath="/dashboard" />}<p className="mt-6 text-center text-sm text-navy">New here? <Link className="font-bold underline" href="/organizations/signup">Set up a posting account.</Link></p></main>;
}