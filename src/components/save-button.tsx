"use client";

import { useState } from "react";

type SaveState = "idle" | "busy" | "saved" | "error";

export function SaveButton({ opportunityId }: { opportunityId: string }): React.JSX.Element {
  const [state, setState] = useState<SaveState>("idle");

  async function save(): Promise<void> {
    if (state === "busy" || state === "saved") return;
    setState("busy");
    try {
      const response = await fetch("/api/v1/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunityId }) });
      setState(response.ok ? "saved" : "error");
    } catch { setState("error"); }
  }

  const label = state === "saved" ? "Saved" : state === "busy" ? "Saving…" : state === "error" ? "Try again" : "Save";
  return <button type="button" className="button-secondary !min-h-11 !px-4" disabled={state === "busy"} aria-pressed={state === "saved"} onClick={save}>{label}</button>;
}
