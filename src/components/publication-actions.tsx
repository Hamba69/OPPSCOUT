"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Mode = "withdraw" | "readmit";

/**
 * Admin > Review: withdraw a verified listing (with a reason) or re-admit a flagged one (after confirming
 * the source was re-checked). Each opens an inline step instead of acting on the first click.
 */
export function PublicationActions({ id, title, mode }: { id: string; title: string; mode: Mode }): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const withdraw = mode === "withdraw";
  const ready = withdraw ? text.trim().length >= 3 : confirmed;

  const submit = (): void => {
    setMessage("");
    startTransition(async () => {
      const body = withdraw ? { action: "withdraw", reason: text.trim() } : { action: "readmit", confirmed: true, ...(text.trim() ? { note: text.trim() } : {}) };
      const response = await fetch(`/api/v1/admin/opportunities/${id}/publication`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (response.ok) { setOpen(false); setText(""); setConfirmed(false); router.refresh(); return; }
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      setMessage(payload?.error?.message ?? "That did not work. Refresh and try again.");
    });
  };

  if (!open) {
    return <button type="button" className={`${withdraw ? "button-secondary" : "button"} !min-h-10 !px-5`} aria-label={`${withdraw ? "Withdraw" : "Re-admit"} ${title}`} onClick={() => setOpen(true)}>{withdraw ? "Withdraw" : "Re-admit"}</button>;
  }
  return <div className="flex min-w-[220px] flex-col gap-2">
    <label className="text-xs font-semibold text-navy">
      {withdraw ? "Why are you withdrawing it? (sent to the poster)" : "Note (optional, sent to the poster)"}
      <input className="field mt-1 !min-h-10 !text-[13px]" value={text} maxLength={500} onChange={(event) => setText(event.target.value)} placeholder={withdraw ? "e.g. Position filled early" : "e.g. Deadline extended to 30 Jan"} />
    </label>
    {!withdraw && <label className="flex items-start gap-2 text-xs font-medium text-ink">
      <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-leaf" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
      I re-checked the source: genuine, open to Ugandans, free to apply, deadline right
    </label>}
    <div className="flex flex-wrap gap-2">
      <button type="button" className="button !min-h-9 !px-4 !text-[13px]" disabled={!ready || pending} onClick={submit}>{withdraw ? "Confirm withdraw" : "Re-admit"}</button>
      <button type="button" className="button-secondary !min-h-9 !px-4 !text-[13px]" disabled={pending} onClick={() => { setOpen(false); setMessage(""); }}>Cancel</button>
    </div>
    {message && <p role="status" className="text-xs font-semibold text-[#9B1C1C]">{message}</p>}
  </div>;
}
