import { AuthForm } from "@/components/auth-form";

export default function OrganizationLoginPage(): React.JSX.Element {
  return <main className="page-shell animate-in"><div className="mx-auto max-w-2xl text-center"><h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Organization login</h1><p className="mt-3 text-navy">Sign in to manage your verified organization workspace.</p></div><AuthForm nextPath="/dashboard" /></main>;
}
