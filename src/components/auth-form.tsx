"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function AuthForm({ nextPath }: { nextPath: string }): React.JSX.Element {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    let supabase;
    try { supabase = createClient(); }
    catch { setBusy(false); setMessage("Authentication is not configured yet."); return; }
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { setMessage(error.message); return; }
      router.push(nextPath);
      router.refresh();
      return;
    }
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { data: result, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    if (result.session) { router.push(nextPath); router.refresh(); }
    else setMessage("Check your email to confirm your account, then sign in.");
  }

  return <section className="card mx-auto mt-8 max-w-lg"><div className="flex rounded-full bg-butter p-1"><button type="button" className={`flex-1 rounded-full px-4 py-2 font-black ${mode === "signin" ? "bg-white" : ""}`} onClick={() => setMode("signin")}>Sign in</button><button type="button" className={`flex-1 rounded-full px-4 py-2 font-black ${mode === "signup" ? "bg-white" : ""}`} onClick={() => setMode("signup")}>Create account</button></div><form className="mt-6 space-y-4" onSubmit={submit}><label><span className="label">Email</span><input className="field" type="email" name="email" autoComplete="email" required /></label><label><span className="label">Password</span><input className="field" type="password" name="password" minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} required /></label><button className="button w-full" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>{message && <p className="rounded-2xl bg-butter p-3 text-sm font-bold" role="status">{message}</p>}</form></section>;
}
