"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const expiredMessage = "Your reset session has expired or is invalid. Request a new reset email.";

export function ResetPasswordForm(): React.JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [sessionValid, setSessionValid] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkSession(): Promise<void> {
      try {
        const { data, error } = await createClient().auth.getUser();
        if (active) {
          setSessionValid(!error && !!data.user);
          if (error || !data.user) setMessage(expiredMessage);
        }
      } catch {
        if (active) setMessage("Unable to check your reset session. Reload the page to try again.");
      } finally {
        if (active) setBusy(false);
      }
    }
    void checkSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!complete) return;
    const timeout = window.setTimeout(() => { router.replace("/feed"); router.refresh(); }, 1500);
    return () => window.clearTimeout(timeout);
  }, [complete, router]);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy || !sessionValid || complete) return;
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy(true); setMessage("");
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) {
        if (error.status === 401 || error.status === 403 || error.code === "session_not_found" || error.name === "AuthSessionMissingError") {
          setSessionValid(false); setMessage(expiredMessage);
        } else setMessage(error.message);
        return;
      }
      setComplete(true);
      setMessage("Password updated. Taking you to your feed…");
    } catch {
      setMessage("Unable to update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="page-shell animate-in">
    <div className="text-center"><p className="eyebrow">Your account</p><h1 className="mt-2 text-4xl font-black">Reset your password.</h1><p className="mx-auto mt-3 max-w-xl text-ink/60">Choose a new password with at least eight characters.</p></div>
    <section className="card mx-auto mt-8 max-w-lg">
      <form className="space-y-4" onSubmit={submit}>
        <label><span className="label">New password</span><input className="field" type="password" name="password" minLength={8} autoComplete="new-password" required disabled={busy || !sessionValid || complete} /></label>
        <button className="button w-full" disabled={busy || !sessionValid || complete}>{busy ? "Please wait…" : "Update password"}</button>
        {message && <p className="rounded-2xl bg-butter p-3 text-sm font-bold" role="status">{message}</p>}
        {!complete && <Link href="/login" className="inline-block text-sm font-bold underline underline-offset-4">Request a new reset email</Link>}
      </form>
    </section>
  </main>;
}
