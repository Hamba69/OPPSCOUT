"use client";

import { useState } from "react";

export function SettingsForm({ channel, enabled }: { channel: string; enabled: boolean }): React.JSX.Element {
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/notifications/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferredChannel: String(data.get("preferredChannel")), secondaryChannels: [], notificationsEnabled: data.get("enabled") === "on" }) });
    setMessage(response.ok ? "Preferences saved." : "Could not save preferences yet.");
  }
  return <form onSubmit={submit} className="card mt-8 max-w-xl space-y-5"><label><span className="label">Best way to reach you</span><select name="preferredChannel" defaultValue={channel} className="field"><option value="email">Email</option><option value="sms">SMS</option><option value="web">Web only</option></select></label><label className="flex items-center gap-3 rounded-2xl bg-butter p-4 font-bold"><input className="size-5 accent-ink" type="checkbox" name="enabled" defaultChecked={enabled} />Send high-fit and deadline reminders</label><p className="text-sm leading-6 text-ink/60">We cap daily alerts, avoid duplicates for 48 hours, and only send deadline reminders at 7 days, 3 days, and 24 hours.</p><button className="button">Save preferences</button>{message && <p className="font-bold" role="status">{message}</p>}</form>;
}
