"use client";

import { useState } from "react";

export interface ProfileFormInitial {
  name: string;
  email: string;
  phone: string;
  educationLevel: string;
  fieldOfStudy: string;
  graduationStatus: string;
  location: string;
  skills: string;
  careerInterests: string;
  preferredLocations: string;
  opportunityCategories: string;
  languages: string;
  workModePreference: "remote" | "onsite" | "hybrid" | "";
}

function list(value: FormDataEntryValue | null): string[] {
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

export function ProfileForm({ initial }: { initial: ProfileFormInitial }): React.JSX.Element {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const body = {
      name: String(data.get("name")), email: String(data.get("email")) || null, phone: String(data.get("phone")) || null,
      educationLevel: String(data.get("educationLevel")) || null, fieldOfStudy: String(data.get("fieldOfStudy")) || null,
      graduationStatus: String(data.get("graduationStatus")) || null, location: String(data.get("location")) || null,
      skills: list(data.get("skills")), careerInterests: list(data.get("careerInterests")), preferredLocations: list(data.get("preferredLocations")),
      opportunityCategories: list(data.get("opportunityCategories")), languages: list(data.get("languages")),
      workModePreference: String(data.get("workModePreference")) || null,
    };
    const response = await fetch("/api/v1/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false); setMessage(response.ok ? "Profile saved — your matches are ready." : "We could not save that yet. Check the fields and try again.");
  }
  const fields: Array<[keyof ProfileFormInitial, string, string]> = [
    ["name", "Your name", "Amina N."], ["email", "Email", "you@example.com"], ["phone", "Phone", "+256…"],
    ["educationLevel", "Education level", "bachelors"], ["fieldOfStudy", "Field of study", "computer science"], ["graduationStatus", "Graduation status", "final year"],
    ["location", "Current location", "Kampala"], ["preferredLocations", "Preferred locations", "Kampala, Remote"],
    ["skills", "Skills", "research, communication, data analysis"], ["careerInterests", "Career interests", "technology, social impact"],
    ["opportunityCategories", "Opportunity types", "internship, scholarship"], ["languages", "Languages", "English, Luganda"],
  ];
  return <form onSubmit={submit} className="card mt-8 grid gap-5 md:grid-cols-2">{fields.map(([name, label, placeholder]) => <label key={name}><span className="label">{label}</span><input className="field" name={name} defaultValue={initial[name]} placeholder={placeholder} required={name === "name"} /></label>)}<label><span className="label">Work mode</span><select className="field" name="workModePreference" defaultValue={initial.workModePreference}><option value="">No preference</option><option value="remote">Remote</option><option value="onsite">On-site</option><option value="hybrid">Hybrid</option></select></label><div className="flex items-end"><button className="button w-full" disabled={busy}>{busy ? "Saving…" : "Save my profile"}</button></div>{message && <p className="md:col-span-2 rounded-2xl bg-butter p-3 font-bold" role="status">{message}</p>}</form>;
}
