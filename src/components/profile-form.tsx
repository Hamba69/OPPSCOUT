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
  const fields: Array<[keyof ProfileFormInitial, string, string]> = [
    ["name", "Your name", "Amina N."], ["email", "Email", "you@example.com"], ["phone", "Phone", "+256…"],
    ["educationLevel", "Education level", "bachelors"], ["fieldOfStudy", "Field of study", "computer science"], ["graduationStatus", "Graduation status", "final year"],
    ["location", "Current location", "Kampala"], ["preferredLocations", "Preferred locations", "Kampala, Remote"],
    ["skills", "Skills", "research, communication, data analysis"], ["careerInterests", "Career interests", "technology, social impact"],
    ["opportunityCategories", "Opportunity types", "internship, scholarship"], ["languages", "Languages", "English, Luganda"],
  ];
  const fieldGuidance: Partial<Record<keyof ProfileFormInitial, string>> = {
    educationLevel: "Use your highest completed level, such as secondary, diploma, bachelors, masters, or phd. Some listings require a specific level.",
    fieldOfStudy: "A broad area is fine, such as education, business, agriculture, or computer science. Leave blank if unsure.",
    graduationStatus: "Useful for programmes with a current-student or recent-graduate rule.",
    location: "Add your current city or country. Some programmes have location requirements.",
    preferredLocations: "Separate choices with commas, for example Kampala, Uganda, or Remote. This helps rank nearby options.",
    skills: "Add a few real skills separated by commas. Try terms from your work or studies, such as research, teaching, communication, or data analysis.",
    careerInterests: "Add topics or roles you want to explore, separated by commas.",
    opportunityCategories: "Separate the types you want with commas, for example job, scholarship, grant, internship, or fellowship.",
    languages: "Some programmes require a particular language. Add only languages you speak.",
    dateOfBirth: "Optional. Only needed to check programmes with an age limit.",
    workModePreference: "Optional. This affects ranking, not eligibility.",
  };

  return (
    <form onSubmit={submit} className="card mt-8 grid gap-5 md:grid-cols-2">
      <p className="md:col-span-2 text-xs text-ink/55">Only your name is required. Add the details you know; you can fill in the rest later.</p>
      {fields.map(([name, label, placeholder]) => {
        const required = name === "name";
        return (
          <label key={name}>
            <span className="label">{label}{required && <span aria-hidden="true"> *</span>}</span>
            <input className="field" name={name} defaultValue={initial[name]} placeholder={placeholder} required={required} />
            {fieldGuidance[name] && <span className="mt-1 block text-xs leading-5 text-ink/60">{fieldGuidance[name]}</span>}
          </label>
        );
      })}
      <label>
        <span className="label">Date of birth</span>
        <input className="field" type="date" name="dateOfBirth" defaultValue={initial.dateOfBirth} max={new Date().toISOString().slice(0, 10)} />
        <span className="mt-1 block text-xs leading-5 text-ink/60">{fieldGuidance.dateOfBirth}</span>
      </label>
      <label>
        <span className="label">Work mode</span>
        <select className="field" name="workModePreference" defaultValue={initial.workModePreference}>
          <option value="">No preference</option>
          <option value="remote">Remote</option>
          <option value="onsite">On-site</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <span className="mt-1 block text-xs leading-5 text-ink/60">{fieldGuidance.workModePreference}</span>
      </label>
      <div className="flex items-end">
        <button className="button w-full" disabled={busy}>{busy ? "Saving…" : afterSavePath ? "Save and see my matches" : "Save my profile"}</button>
      </div>
      {message && <p className="md:col-span-2 rounded-2xl bg-butter p-3 font-bold" role="status">{message}</p>}
    </form>
  );
}
