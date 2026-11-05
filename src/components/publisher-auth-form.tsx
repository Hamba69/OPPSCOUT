"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { validateSignupPassword } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

function MailIcon(): React.JSX.Element {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-navy"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
}

function LockIcon(): React.JSX.Element {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-navy"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
}

function ArrowIcon(): React.JSX.Element {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export function PublisherAuthForm({ mode, nextPath }: { mode: Mode; nextPath: string }): React.JSX.Element {
  const router = useRouter();
  const signup = mode === "signup";
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);

  async function recoverPassword(): Promise<void> {
    if (!emailInput.current?.reportValidity()) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(emailInput.current.value.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      setMessage(error ? error.message : "Check your email for a link to reset your password.");
    } catch {
      setMessage("Unable to send a reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation(): Promise<void> {
    if (!emailInput.current?.reportValidity()) return;
    setBusy(true); setMessage("");
    try {
      const { error } = await createClient().auth.resend({
        type: "signup",
        email: emailInput.current.value.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
      });
      setMessage(error ? error.message : "Confirmation email resent. Check your inbox and spam folder.");
    } catch {
      setMessage("Unable to resend the confirmation email. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    let supabase;
    try { supabase = createClient(); }
    catch { setBusy(false); setMessage("Authentication is not configured yet."); return; }
    if (!signup) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { setMessage(error.message); return; }
      router.push(nextPath);
      router.refresh();
      return;
    }
    const passwordError = validateSignupPassword(password);
    if (passwordError) {
      setBusy(false);
      setMessage(passwordError);
      return;
    }
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { data: result, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    if (result.session) { router.push(nextPath); router.refresh(); }
    else { setConfirmationPending(true); setMessage("Check your email to confirm your account, then log in. If it does not arrive, resend it below."); }
  }

  return <form className="mt-6" onSubmit={submit}>
    <label htmlFor="publisher-email" className="publisher-label">Email</label>
    <div className="publisher-input">
      <MailIcon />
      <input ref={emailInput} id="publisher-email" type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
    </div>

    <div className="mt-5 flex items-baseline justify-between gap-3">
      <label htmlFor="publisher-password" className="publisher-label !mb-0">Password</label>
      {!signup && <button type="button" className="text-sm font-semibold text-ink underline underline-offset-2" disabled={busy} onClick={recoverPassword}>Forgot password?</button>}
    </div>
    <div className="publisher-input mt-2">
      <LockIcon />
      <input id="publisher-password" type={showPassword ? "text" : "password"} name="password" minLength={signup ? 12 : undefined} autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "Create a password" : "Enter your password"} required />
      <button type="button" className="text-sm font-semibold text-navy hover:text-ink" aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>
    </div>
    {signup && <p className="mt-2 text-xs text-navy">Use 12+ characters with uppercase, lowercase, a number and a symbol.</p>}

    <button className="publisher-submit mt-5" disabled={busy}>{busy ? "Please wait…" : <>{signup ? "Create publisher account" : "Log in"}<ArrowIcon /></>}</button>

    {confirmationPending && <button type="button" className="mt-3 text-sm font-bold underline underline-offset-4" disabled={busy} onClick={resendConfirmation}>Resend confirmation email</button>}
    {message && <p className="mt-4 rounded-2xl border border-honey bg-butter p-3 text-sm font-bold text-ink" role="status">{message}</p>}
    <p className="mt-4 text-center text-xs leading-5 text-navy">Your personal and publisher access use the same email and password. Sign in with those credentials on either page.</p>
  </form>;
}
