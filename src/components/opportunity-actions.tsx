"use client";

import { ExternalIcon } from "@/components/icons";
import { useEffect, useRef, useState } from "react";

export function OpportunityActions({ opportunityId, sourceUrl }: { opportunityId: string; sourceUrl: string }): React.JSX.Element {
  const tracked = useRef(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [intentRecorded, setIntentRecorded] = useState(false);
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
    setMessage(response.ok ? "Saved. We’ll keep track of any closing date." : "Could not save this yet.");
    } catch { setMessage("Could not connect. Please try saving again."); }
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

  async function recordIntent(): Promise<void> {
    if (busy || intentRecorded) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/opportunities/${opportunityId}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType: "apply_intent" }) });
      if (response.ok) setIntentRecorded(true);
      setMessage(response.ok ? "Plan noted. Check the requirements and apply through the official source when you are ready." : "Could not record your plan yet.");
    } catch { setMessage("Could not connect. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="mt-5">
    <a className="button w-full sm:w-auto" href={sourceUrl} target="_blank" rel="noopener noreferrer" onClick={trackSourceClick}>Apply on official site <ExternalIcon /></a>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className="button-secondary" disabled={busy} onClick={save}>{busy ? "Working…" : "Save for later"}</button>
      <button type="button" className="button-secondary" disabled={busy || intentRecorded} onClick={recordIntent}>{intentRecorded ? "Marked as planning to apply" : busy ? "Working…" : "I plan to apply"}</button>
      <button type="button" className="min-h-12 rounded-2xl px-4 text-sm font-semibold text-navy underline underline-offset-4 hover:text-ink" aria-expanded={reporting} onClick={() => setReporting(!reporting)}>Report a problem</button>
    </div>
    {reporting && <form onSubmit={report} className="card mt-4 space-y-3"><label><span className="label">What looks wrong with this listing?</span><textarea className="field min-h-24" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} required placeholder="For example: it asks for a payment, or the link does not match the organization." /></label>
      <div className="flex gap-2"><button className="button" disabled={busy || !reason.trim()}>{busy ? "Sending…" : "Submit report"}</button><button type="button" className="button-secondary" onClick={() => setReporting(false)} disabled={busy}>Cancel</button></div></form>}
    {message && <p className="mt-3 rounded-2xl border border-honey bg-butter p-3 text-sm font-semibold text-ink" role="status" aria-live="polite">{message}</p>}
  </div>;
}
