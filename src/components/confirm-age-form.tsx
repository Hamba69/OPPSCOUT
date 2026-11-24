"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/custom-icon";
import { dateOfBirthProblem } from "@/lib/date-of-birth";

/** Asks for a date of birth once, for accounts made before sign-up asked for it. Only 18+ can continue. */
export function ConfirmAgeForm({ nextPath, initialDate }: { nextPath: string; initialDate: string }): React.JSX.Element {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const problem = dateOfBirthProblem(date);
    if (problem) { setMessage(problem); return; }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/account/age", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dateOfBirth: date }) });
      const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      if (!response.ok) { setMessage(body?.error?.message ?? "Could not confirm your age. Please try again."); return; }
      router.push(nextPath);
      router.refresh();
    } catch {
      setMessage("Could not confirm your age. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="mx-auto w-full max-w-[440px]">
    <div className="surface !rounded-[1.75rem] !p-7 sm:!p-9">
      <div className="text-center">
        <div className="orb mx-auto mb-3.5 size-12" aria-hidden="true" />
        <h1 className="!text-[1.625rem] !font-extrabold !leading-tight tracking-tight text-ink">Confirm your age</h1>
        <p className="mt-2 text-sm leading-6 text-navy">OppScout is for adults aged 18 and over. Enter your date of birth to continue. Some opportunities also have age limits.</p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <div>
          <label htmlFor="confirm-dob" className="mb-1.5 block text-sm font-semibold text-ink">Date of birth</label>
          <input id="confirm-dob" className="field w-full" type="date" value={date} max={today} required onChange={(event) => setDate(event.target.value)} />
        </div>
        <button type="submit" className="mt-2 flex min-h-[3.125rem] w-full items-center justify-center gap-2 rounded-full bg-[#FFD43B] px-4 text-[15px] font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_16px_rgba(230,170,0,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy}>
          {busy ? "Please wait…" : "Continue"}{!busy && <Icon name="arrow" size={20} />}
        </button>
        {message && <p className="rounded-2xl border border-navy/15 bg-cream p-3 text-sm font-semibold text-ink" role="status">{message}</p>}
      </form>
      <form action="/auth/logout" method="post" className="mt-4 text-center"><button className="text-sm font-semibold text-navy underline underline-offset-2">Sign out</button></form>
    </div>
  </section>;
}
