"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ProfileFormInitial {
  name: string;
  email: string;
  phone: string;
  educationLevel: string;
  fieldOfStudy: string;
  graduationStatus: string;
  dateOfBirth: string;
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

export function ProfileForm({ initial, afterSavePath }: { initial: ProfileFormInitial; afterSavePath?: string }): React.JSX.Element {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const body = {
      name: String(data.get("name")), email: String(data.get("email")) || null, phone: String(data.get("phone")) || null,
      educationLevel: String(data.get("educationLevel")) || null, fieldOfStudy: String(data.get("fieldOfStudy")) || null,
      graduationStatus: String(data.get("graduationStatus")) || null, dateOfBirth: String(data.get("dateOfBirth")) || null, location: String(data.get("location")) || null,
      skills: list(data.get("skills")), careerInterests: list(data.get("careerInterests")), preferredLocations: list(data.get("preferredLocations")),
      opportunityCategories: list(data.get("opportunityCategories")), languages: list(data.get("languages")),
      workModePreference: String(data.get("workModePreference")) || null,
    };
    try {
      const response = await fetch("/api/v1/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (response.ok && afterSavePath) {
        router.replace(afterSavePath);
        router.refresh();
      } else {
        setMessage(response.ok ? "Profile saved. We’ll use it to find relevant opportunities." : "We could not save that yet. Check the fields and try again.");
      }
    } catch {
      setMessage("We could not connect to save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  type Field = [keyof ProfileFormInitial, string, string, string?];
  const sections: Array<[string, string, Field[]]> = [
    ["About you", "How we and organizations can reach you.", [["name", "Your name", "Amina N."], ["email", "Email", "you@example.com"], ["phone", "Phone", "+256…"], ["location", "Where you live now", "Kampala"]]],
    ["Study and skills", "Eligibility is checked against these first.", [["educationLevel", "Education level", "bachelors"], ["fieldOfStudy", "Field of study", "computer science"], ["graduationStatus", "Graduation status", "final year"], ["skills", "Skills", "research, communication, data analysis", "Separate with commas"], ["languages", "Languages", "English, Luganda", "Separate with commas"]]],
    ["What you are looking for", "Helps us rank what fits you best.", [["opportunityCategories", "Opportunity types", "internship, scholarship", "Separate with commas"], ["careerInterests", "Career interests", "technology, social impact", "Separate with commas"], ["preferredLocations", "Places you would work", "Kampala, Remote", "Separate with commas"]]],
  ];
  return <form onSubmit={submit} className="mt-6 space-y-5">
    {sections.map(([title, hint, fields], index) => <fieldset key={title} className="card">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-lg font-extrabold text-ink">{title}</h2><p className="mt-1 text-sm text-navy">{hint}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {fields.map(([name, label, placeholder, help]) => <label key={name}><span className="label">{label}</span><input className="field" name={name} defaultValue={initial[name]} placeholder={placeholder} required={name === "name"} />{help && <span className="mt-1 block text-xs text-navy">{help}</span>}</label>)}
        {index === 1 && <label><span className="label">Date of birth</span><input className="field" type="date" name="dateOfBirth" defaultValue={initial.dateOfBirth} max={new Date().toISOString().slice(0, 10)} /></label>}
        {index === 2 && <label><span className="label">Work mode</span><select className="field" name="workModePreference" defaultValue={initial.workModePreference}><option value="">No preference</option><option value="remote">Remote</option><option value="onsite">On-site</option><option value="hybrid">Hybrid</option></select></label>}
      </div>
    </fieldset>)}
    <div className="sticky bottom-24 z-10 md:static md:bottom-auto"><button className="button w-full md:w-auto" disabled={busy}>{busy ? "Saving…" : "Save my profile"}</button></div>
    {message && <p className="rounded-2xl border border-honey bg-butter p-3 font-bold text-ink" role="status">{message}</p>}
  </form>;
}
