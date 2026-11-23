"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** Settings > Your data: download everything, or permanently delete the account after typing DELETE. */
export function AccountDataActions(): React.JSX.Element {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const remove = (): void => {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/v1/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) });
      if (response.ok) { router.replace("/"); router.refresh(); return; }
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      setMessage(payload?.error?.message ?? "Your account could not be deleted. Please try again.");
    });
  };

  return <div className="flex flex-col gap-4">
    <div>
      <p className="text-[13px] leading-6 text-navy">Download a copy of your profile, saved opportunities, matches, notifications, activity and feedback as a file.</p>
      <a className="button-secondary mt-3" href="/api/v1/account/export" download>Download my data</a>
    </div>
    <div className="border-t border-ink/10 pt-4">
      <p className="text-[13px] leading-6 text-navy">Deleting your account removes your profile, matches, saved list, uploaded documents and sign-in. This cannot be undone.</p>
      {!confirming
        ? <button type="button" className="button-secondary mt-3 !text-[#B3261E]" onClick={() => setConfirming(true)}>Delete my account</button>
        : <div className="mt-3 flex flex-col gap-2 rounded-2xl glass-inset p-3">
            <label className="text-sm font-semibold text-ink">Type DELETE to confirm
              <input className="field mt-1" value={typed} autoComplete="off" onChange={(event) => setTyped(event.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="button !bg-[#B3261E] !text-white" disabled={typed !== "DELETE" || pending} onClick={remove}>{pending ? "Deleting…" : "Permanently delete"}</button>
              <button type="button" className="button-secondary" disabled={pending} onClick={() => { setConfirming(false); setTyped(""); setMessage(""); }}>Cancel</button>
            </div>
          </div>}
      {message && <p role="alert" className="mt-2 text-sm font-semibold text-[#B3261E]">{message}</p>}
    </div>
  </div>;
}
