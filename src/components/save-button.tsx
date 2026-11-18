"use client";

import { useState } from "react";

import { Icon } from "@/components/app-shell";

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

  const label = state === "saved" ? "Saved" : state === "busy" ? "Saving…" : state === "error" ? "Could not save, try again" : "Save opportunity";
  return <button type="button" className="icon-button raise" aria-label={label} title={label} disabled={state === "busy"} aria-pressed={state === "saved"} onClick={save}>
    <Icon name={state === "error" ? "alert" : state === "saved" ? "check" : "bookmark"} size={20} />
  </button>;
}
