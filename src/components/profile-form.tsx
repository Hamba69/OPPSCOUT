"use client";

import { useState } from "react";
import { ProfileSelect, ProfileMultiChoice } from "@/components/profile-choice";
import { buildProfileChoices, type ProfileChoices, type ProfileChoiceField } from "@/services/profile/choices";
import type { ExperienceEntry } from "@/core/entities/domain";

export interface ProfileFormInitial {
  name: string;
  email: string;
  phone: string;
  educationLevel: string;
  fieldOfStudy: string;
  graduationStatus: string;
  dateOfBirth: string;
  location: string;
  skills: string[];
  careerInterests: string[];
  preferredLocations: string[];
  opportunityCategories: string[];
  languages: string[];
  workModePreference: "remote" | "onsite" | "hybrid" | "";
  certifications?: string[];
  workExperience?: ExperienceEntry[];
  internshipExperience?: ExperienceEntry[];
}

export function ProfileForm({ initial, choices = buildProfileChoices() }: { initial: ProfileFormInitial; choices?: ProfileChoices }): React.JSX.Element {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setMessage(""); setFailed(false);
    const data = new FormData(event.currentTarget);
    const body = {
      name: String(data.get("name")), email: String(data.get("email")) || null, phone: String(data.get("phone")) || null,
      educationLevel: values.educationLevel || null, fieldOfStudy: values.fieldOfStudy || null,
      graduationStatus: values.graduationStatus || null, dateOfBirth: String(data.get("dateOfBirth")) || null, location: values.location || null,
      skills: values.skills, careerInterests: values.careerInterests, preferredLocations: values.preferredLocations,
      opportunityCategories: values.opportunityCategories, languages: values.languages,
      certifications: values.certifications ?? [], workExperience: values.workExperience ?? [], internshipExperience: values.internshipExperience ?? [],
      workModePreference: values.workModePreference || null,
    };
    try {
      const response = await fetch("/api/v1/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        const errors = result?.error?.details?.fieldErrors;
        setFailed(true);
        setMessage(errors ? Object.values(errors).flat().join(" ") : "We could not save that yet. Check the fields and try again.");
        return;
      }
      setMessage(response.ok ? "Profile saved. We’ll use it to find relevant opportunities." : "We could not save that yet. Check the fields and try again.");
    } catch {
      setFailed(true);
      setMessage("We could not connect to save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  type Field = [keyof Omit<ProfileFormInitial, "workExperience" | "internshipExperience" | "certifications">, string, string, string?];
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
        {fields.map(([name, label, placeholder]) => {
          if (name in choices) {
            const field = name as ProfileChoiceField;
            const value = values[field];
            return Array.isArray(value)
              ? <ProfileMultiChoice key={name} name={name} label={label} hint="Choose what fits you, or add your own." options={choices[field]} values={value} onChange={next => setValues(current => ({ ...current, [name]: next }))} />
              : <ProfileSelect key={name} name={name} label={name === "graduationStatus" ? "Study / graduation status" : label} options={choices[field]} value={value} allowCustom onChange={next => setValues(current => ({ ...current, [name]: next }))} />;
          }
          return <label key={name}><span className="label">{label}</span><input className="field" name={name} defaultValue={initial[name]} placeholder={placeholder} required={name === "name"} /></label>;
        })}
        {index === 1 && <label><span className="label">Date of birth</span><input className="field" type="date" name="dateOfBirth" defaultValue={initial.dateOfBirth} max={new Date().toISOString().slice(0, 10)} /></label>}
        {index === 2 && <fieldset><legend className="label">Work mode</legend><div className="flex flex-wrap gap-3">{(["", "remote", "onsite", "hybrid"] as const).map(mode => <label key={mode} className="flex min-h-11 items-center gap-2"><input type="radio" name="workModePreference" checked={values.workModePreference === mode} onChange={() => setValues(current => ({ ...current, workModePreference: mode }))} />{mode === "" ? "No preference" : mode === "remote" ? "Remote" : mode === "onsite" ? "On-site" : "Hybrid"}</label>)}</div></fieldset>}
      </div>
    </fieldset>)}
    <fieldset className="card"><legend className="sr-only">Experience and qualifications</legend><h2 className="text-lg font-extrabold text-ink">Experience and qualifications</h2><p className="mt-1 text-sm text-navy">Add relevant roles and completed months. Count overlapping months only once; list each role under work or internships.</p>
      <div className="mt-4"><ProfileMultiChoice name="certifications" label="Certifications" hint="Add the exact name of each qualification you hold." options={[]} values={values.certifications ?? []} onChange={next => setValues(current => ({ ...current, certifications: next }))} /></div>
      {(["workExperience", "internshipExperience"] as const).map(kind => <div key={kind} className="mt-5"><h3 className="font-bold">{kind === "workExperience" ? "Work experience" : "Internship experience"}</h3>
        {(values[kind] ?? []).map((entry, index) => <div key={index} className="mt-3 grid gap-3 rounded-2xl border border-honey p-3 sm:grid-cols-2">
          <label><span className="label">{kind === "workExperience" ? "Work" : "Internship"} role {index + 1}</span><input className="field" required maxLength={160} value={entry.title} onChange={event => setValues(current => ({ ...current, [kind]: (current[kind] ?? []).map((item, i) => i === index ? { ...item, title: event.target.value } : item) }))} /></label>
          <label><span className="label">{kind === "workExperience" ? "Work" : "Internship"} months {index + 1}</span><input className="field" type="number" required min={0} max={600} step={1} value={entry.months} onChange={event => setValues(current => ({ ...current, [kind]: (current[kind] ?? []).map((item, i) => i === index ? { ...item, months: Number(event.target.value) } : item) }))} /></label>
          <button type="button" className="justify-self-start text-sm font-bold underline" onClick={() => setValues(current => ({ ...current, [kind]: (current[kind] ?? []).filter((_, i) => i !== index) }))}>Remove {kind === "workExperience" ? "work" : "internship"} role {index + 1}</button>
        </div>)}
        <button type="button" className="button-secondary mt-3" disabled={(values[kind]?.length ?? 0) >= 30} onClick={() => setValues(current => ({ ...current, [kind]: [...(current[kind] ?? []), { title: "", months: 0 }] }))}>Add {kind === "workExperience" ? "work" : "internship"} experience</button>
      </div>)}
    </fieldset>
    <div className="sticky bottom-24 z-10 md:static md:bottom-auto"><button className="button w-full md:w-auto" disabled={busy}>{busy ? "Saving…" : "Save my profile"}</button></div>
    {message && <p className="rounded-2xl border border-honey bg-butter p-3 font-bold text-ink" role={failed ? "alert" : "status"}>{message}</p>}
  </form>;
}
