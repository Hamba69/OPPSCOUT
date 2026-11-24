"use client";

import { Icon } from "@/components/custom-icon";
import { ExternalIcon } from "@/components/icons";
import { useTransientMessage } from "@/hooks/use-transient-message";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function OpportunityActions({
  opportunityId,
  sourceUrl,
  savedId,
}: {
  opportunityId: string;
  sourceUrl: string;
  savedId?: string;
}): React.JSX.Element {
  const router = useRouter();
  const tracked = useRef(false);
  const [message, setMessage] = useTransientMessage<string>();
  const [busy, setBusy] = useState(false);
  const [currentSavedId, setCurrentSavedId] = useState(savedId);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void fetch(`/api/v1/opportunities/${opportunityId}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType: "view" }) }).catch(() => { /* Reading stays available if tracking is offline. */ });
  }, [opportunityId]);

  async function save(): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/v1/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunityId }) });
      if (!response.ok) {
        setMessage("Could not save this yet.");
        return;
      }
      const body = await response.json() as { data?: { id?: string } };
      setCurrentSavedId(body.data?.id);
      setMessage("Saved. We’ll keep track of any closing date.");
      // Re-render the page so the days-left countdown appears now that it is saved.
      router.refresh();
    } catch { setMessage("Could not connect. Please try saving again."); }
    finally { setBusy(false); }
  }

  async function unsave(): Promise<void> {
    if (busy || !currentSavedId) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/saved/${currentSavedId}`, { method: "DELETE" });
      if (!response.ok) {
        setMessage("Could not remove this opportunity from your saved list.");
        return;
      }
      setCurrentSavedId(undefined);
      setMessage("Removed from your saved opportunities.");
      router.refresh();
    } catch { setMessage("Could not connect. Please try again."); }
    finally { setBusy(false); }
  }

  async function report(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!reason.trim() || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/v1/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunityId, reason: reason.trim() }) });
      setMessage(response.ok ? "Thank you. This listing is now held for review." : "We could not send your report. Please try again.");
      if (response.ok) { setReporting(false); setReason(""); }
    } catch { setMessage("Could not connect. Please try sending your report again."); }
    finally { setBusy(false); }
  }

  function trackSourceClick(): void {
    void fetch(`/api/v1/opportunities/${opportunityId}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType: "click" }), keepalive: true }).catch(() => { /* The official source remains available without tracking. */ });
  }

  return <div className="mt-6">
    <div className="flex flex-wrap items-center gap-2.5">
      <a className="button !min-h-11" href={sourceUrl} target="_blank" rel="noopener noreferrer" onClick={trackSourceClick}><ExternalIcon />Apply on official site</a>
      <button type="button" className="button-secondary !min-h-11" disabled={busy} onClick={currentSavedId ? unsave : save}>
        <Icon name="bookmark" size={20} />
        {busy ? "Working…" : currentSavedId ? "Unsave" : "Save"}
      </button>
      <button type="button" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-navy hover:text-ink" aria-expanded={reporting} onClick={() => setReporting(!reporting)}>
        <Icon name="flag" size={20} />Report a problem
      </button>
    </div>
    {reporting && <form onSubmit={report} className="mt-4 space-y-3 rounded-2xl glass-inset p-5"><label><span className="label">What looks wrong with this listing?</span><textarea className="field min-h-24" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} required placeholder="For example: it asks for a payment, or the link does not match the organization." /></label>
      <div className="flex gap-2"><button className="button" disabled={busy || !reason.trim()}>{busy ? "Sending…" : "Submit report"}</button><button type="button" className="button-secondary" onClick={() => setReporting(false)} disabled={busy}>Cancel</button></div></form>}
    {message && <p className="mt-3 text-sm font-semibold text-[#6B4E00]" role="status" aria-live="polite">{message}</p>}
  </div>;
}
