import Link from "next/link";
import { getOptionalAuth } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function OrganizationSignupPage(): Promise<React.JSX.Element> {
  const auth = await getOptionalAuth();
  return <main className="page-shell animate-in"><div className="mx-auto max-w-2xl text-center"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Create an organization account</h1><p className="mt-3 text-navy">{auth?.role === "user" ? "Your seeker account cannot be converted. Use a different email address for an organization account." : "Create a separate account for your organization workspace."}</p></div>{!auth && <AuthForm nextPath="/onboarding/organization" />}<p className="mt-6 text-center text-sm text-navy">Already registered? <Link className="font-bold underline" href="/organizations/login">Log in here.</Link></p></main>;
}
