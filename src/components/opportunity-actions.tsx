"use client";

import { useEffect, useRef, useState } from "react";

export function OpportunityActions({ opportunityId, sourceUrl }: { opportunityId: string; sourceUrl: string }): React.JSX.Element {
  const tracked = useRef(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [intentRecorded, setIntentRecorded] = useState(false);
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
    setMessage(response.ok ? "Saved. We’ll help you remember the deadline." : "Could not save this yet.");
    } catch { setMessage("Could not connect. Please try saving again."); }
    finally { setBusy(false); }
  }

  async function report(): Promise<void> {
    const reason = window.prompt("What looks suspicious? Please keep it brief.");
    if (!reason) return;
    try {
    const response = await fetch("/api/v1/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunityId, reason }) });
    setMessage(response.ok ? "Thank you. This listing is now held for review." : "Could not send the report yet.");
    } catch { setMessage("Could not connect. Please try sending your report again."); }
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

  return <div className="mt-6"><div className="flex flex-wrap gap-3"><button className="button" disabled={busy} onClick={save}>Save opportunity</button><a className="button-secondary" href={sourceUrl} target="_blank" rel="noopener noreferrer" onClick={trackSourceClick}>Apply on official site ↗</a><button className="button-secondary" disabled={busy || intentRecorded} onClick={recordIntent}>{intentRecorded ? "Plan noted" : "I plan to apply"}</button><button className="rounded-full px-4 py-2 text-sm font-bold text-coral hover:bg-coral/10" onClick={report}>Report listing</button></div>{message && <p className="mt-3 rounded-2xl bg-butter p-3 text-sm font-bold" role="status">{message}</p>}</div>;
}
