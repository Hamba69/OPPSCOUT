"use client";

import { Icon } from "@/components/custom-icon";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";

import { LEGAL } from "@/config/legal";
import { MIN_PASSWORD_LENGTH, PASSWORD_HINT, validateSignupPassword } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";

function MailIcon(): React.JSX.Element { return <Icon name="mail" size={20} />; }

function LockIcon(): React.JSX.Element { return <Icon name="lock" size={20} />; }

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
    if (data.get("consent") !== "on") {
      setBusy(false);
      setMessage("Please agree to the Terms of Use and Privacy Policy to create an account.");
      return;
    }
    const passwordError = validateSignupPassword(password);
    if (passwordError) {
      setBusy(false);
      setMessage(passwordError);
      return;
    }
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { data: result, error } = await supabase.auth.signUp({
      email,
      password,
      // Record what the person agreed to, and when, with their account.
      options: { emailRedirectTo: redirectTo, data: { termsVersion: LEGAL.termsVersion, termsAcceptedAt: new Date().toISOString(), consentToStorageOutsideUganda: true } },
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
    <section className="mx-auto w-full max-w-[440px]">
      <div className="surface !rounded-[1.75rem] !p-7 sm:!p-9">
        <div className="text-center">
          <div className="orb mx-auto mb-3.5 size-12" aria-hidden="true" />
          <h1 className="!text-[1.625rem] !font-extrabold !leading-tight tracking-tight text-ink">
            {isSignin ? "Welcome back" : "Create your account"}
          </h1>
        </div>

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
                className="w-full rounded-2xl border border-ink/10 bg-white/70 backdrop-blur-md focus:bg-white py-3.5 pl-11 pr-4 text-ink outline-none transition placeholder:text-navy/45 hover:border-honey hover:ring-4 hover:ring-honey/30 focus:border-amber focus:ring-4 focus:ring-amber/40"
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
                className="w-full rounded-2xl border border-ink/10 bg-white/70 backdrop-blur-md focus:bg-white py-3.5 pl-11 pr-16 text-ink outline-none transition placeholder:text-navy/45 hover:border-honey hover:ring-4 hover:ring-honey/30 focus:border-amber focus:ring-4 focus:ring-amber/40"
                type={showPassword ? "text" : "password"}
                name="password"
                minLength={isSignin ? undefined : MIN_PASSWORD_LENGTH}
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
              <p className="mt-1.5 text-xs text-navy/70">{PASSWORD_HINT}</p>
            )}
          </div>

          {!isSignin && (
            <label className="flex items-start gap-3 text-sm leading-6 text-ink">
              <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-leaf" />
              <span>I agree to the <Link href="/terms" target="_blank" className="font-semibold underline underline-offset-2">Terms of Use</Link> and <Link href="/privacy" target="_blank" className="font-semibold underline underline-offset-2">Privacy Policy</Link>, including my data being stored by OppScout&apos;s service providers outside Uganda.</span>
            </label>
          )}

          <button
            type="submit"
            className="mt-2 flex min-h-[3.125rem] w-full items-center justify-center gap-2 rounded-full bg-[#FFD43B] px-4 text-[15px] font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(230,170,0,0.25)] transition hover:brightness-105 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/40 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy}
          >
            {busy ? "Please wait…" : isSignin ? "Log in" : "Create account"}
            {!busy && (
              <Icon name="arrow" size={20} />
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
