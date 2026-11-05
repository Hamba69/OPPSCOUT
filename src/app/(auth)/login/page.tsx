import { redirect } from "next/navigation";
import { getOptionalAuth } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

interface LoginPageProps { searchParams: Promise<{ next?: string; error?: string; mode?: string }> }

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.JSX.Element> {
  const { next: requested, error, mode } = await searchParams;
  const auth = await getOptionalAuth();
  const nextPath = requested?.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\") ? requested : "/feed";
  if (auth) redirect(nextPath);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* Soft gold wash behind the card (matches mockups) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, #FFF6C8 0%, #FAFAF6 55%, #FAFAF6 100%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 pb-10 pt-8 sm:px-6">
        {error === "callback" && (
          <p
            className="mb-6 rounded-2xl border border-coral bg-coral/15 p-3 text-sm font-bold text-ink"
            role="alert"
          >
            Your email link is invalid or has expired. To reset your password, enter your email below
            and choose “Forgot password?”.
          </p>
        )}

        <div className="flex flex-1 flex-col justify-center">
          <AuthForm nextPath={nextPath} initialMode={mode === "signup" ? "signup" : "signin"} />
        </div>
      </div>
    </main>
  );
}
