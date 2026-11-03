"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function MailIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-honey">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-honey">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function AuthForm({ nextPath, initialMode = "signin" }: { nextPath: string; initialMode?: "signin" | "signup" }): React.JSX.Element {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);

  async function recoverPassword(): Promise<void> {
    if (!emailInput.current?.reportValidity()) return;
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(emailInput.current.value.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      setMessage(error ? error.message : "Check your email for a link to reset your password.");
    } catch {
      setMessage("Unable to send a reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    let supabase;
    try {
      supabase = createClient();
    } catch {
      setBusy(false);
      setMessage("Authentication is not configured yet.");
      return;
    }
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      router.push(nextPath);
      router.refresh();
      return;
    }
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { data: result, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (result.session) {
      router.push(nextPath);
      router.refresh();
    } else {
      setConfirmationPending(true);
      setMessage("Check your email to confirm your account, then sign in. If it does not arrive, resend it below.");
    }
  }

  async function resendConfirmation(): Promise<void> {
    if (!emailInput.current?.reportValidity()) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.resend({
        type: "signup",
        email: emailInput.current.value.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      setMessage(error ? error.message : "Confirmation email resent. Check your inbox and spam folder.");
    } catch {
      setMessage("Unable to resend the confirmation email. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  const isSignin = mode === "signin";

  return (
    <section className="mx-auto w-full max-w-[400px]">
      <div className="rounded-[1.5rem] border border-ink/[0.06] bg-white p-6 shadow-[0_12px_40px_rgba(30,41,59,0.08)] sm:p-8">
        {/* Mode badge */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink/[0.08] bg-cream px-3 py-1.5 text-xs font-semibold tracking-wide text-navy">
          <span className="h-1.5 w-1.5 rounded-full bg-navy" aria-hidden="true" />
          {isSignin ? "WELCOME BACK" : "GET STARTED"}
        </div>

        {/* Heading */}
        <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-ink">
          {isSignin ? "Log in" : "Create your account"}
        </h1>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          {/* Email */}
          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-ink">
              Email
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                <MailIcon />
              </span>
              <input
                id="auth-email"
                ref={emailInput}
                className="w-full rounded-2xl border border-ink/10 bg-butter py-3.5 pl-11 pr-4 text-ink outline-none transition placeholder:text-navy/45 hover:border-navy/50 hover:ring-4 hover:ring-navy/15 focus:border-navy focus:ring-4 focus:ring-navy/30"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="auth-password" className="block text-sm font-semibold text-ink">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                <LockIcon />
              </span>
              <input
                id="auth-password"
                className="w-full rounded-2xl border border-ink/10 bg-butter py-3.5 pl-11 pr-16 text-ink outline-none transition placeholder:text-navy/45 hover:border-navy/50 hover:ring-4 hover:ring-navy/15 focus:border-navy focus:ring-4 focus:ring-navy/30"
                type={showPassword ? "text" : "password"}
                name="password"
                minLength={8}
                autoComplete={isSignin ? "current-password" : "new-password"}
                placeholder={isSignin ? "Enter your password" : "Create a password"}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-navy transition hover:text-ink"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {isSignin && (
              <button
                type="button"
                className="ml-auto mt-1.5 block text-sm font-semibold text-navy underline underline-offset-2 transition hover:text-ink"
                disabled={busy}
                onClick={recoverPassword}
              >
                Forgot password?
              </button>
            )}
            {!isSignin && (
              <p className="mt-1.5 text-xs text-navy/70">At least 8 characters.</p>
            )}
          </div>

          {/* Submit — goldish yellow button */}
          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber px-4 py-3.5 text-base font-bold text-ink shadow-sm transition hover:brightness-105 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy}
          >
            {busy ? "Please wait…" : isSignin ? "Log in" : "Create account"}
            {!busy && (
              <span aria-hidden="true" className="text-lg leading-none">
                →
              </span>
            )}
          </button>

          {confirmationPending && (
            <button
              type="button"
              className="w-full text-center text-sm font-bold text-navy underline underline-offset-4"
              disabled={busy}
              onClick={resendConfirmation}
            >
              Resend confirmation email
            </button>
          )}

          {message && (
            <p
              className="rounded-2xl border border-navy/15 bg-cream p-3 text-sm font-semibold text-ink"
              role="status"
            >
              {message}
            </p>
          )}
        </form>

        {/* Footer switch */}
        <div className="mt-6 border-t border-ink/[0.06] pt-5 text-center text-sm text-navy">
          {isSignin ? (
            <>
              New here?{" "}
              <button
                type="button"
                className="font-bold text-ink underline underline-offset-2 transition hover:text-navy"
                disabled={busy}
                onClick={() => {
                  setMode("signup");
                  setConfirmationPending(false);
                  setMessage("");
                  setShowPassword(false);
                }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-bold text-ink underline underline-offset-2 transition hover:text-navy"
                disabled={busy}
                onClick={() => {
                  setMode("signin");
                  setConfirmationPending(false);
                  setMessage("");
                  setShowPassword(false);
                }}
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
