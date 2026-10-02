"use client";

import { useMemo, useState } from "react";

import { ProfileMultiChoice, ProfileSelect } from "@/components/profile-choice";
import type { ProfileChoices } from "@/services/profile/choices";

const EDUCATION_ORDER = ["no formal education", "secondary", "certificate", "diploma", "bachelors", "masters", "phd"];

export function OpportunityForm({ organizationId, choices }: { organizationId: string; choices: ProfileChoices }): React.JSX.Element {
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "busy"; text: string } | null>(null);
  const [educationLevels, setEducationLevels] = useState<string[]>([]);
  const [fieldsOfStudy, setFieldsOfStudy] = useState<string[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const education = useMemo(() => [...choices.educationLevel].sort((a, b) => EDUCATION_ORDER.indexOf(a.value) - EDUCATION_ORDER.indexOf(b.value)), [choices.educationLevel]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!location) { setMessage({ tone: "error", text: "Select the location of the opportunity." }); return; }
    const form = event.currentTarget; const data = new FormData(form);
    setMessage({ tone: "busy", text: "Submitting for review…" });
    const closingDate = String(data.get("deadline") ?? "");
    const body = {
      title: String(data.get("title")).trim(), organizationId, category: String(data.get("category")), description: String(data.get("description")).trim(),
      eligibility: { educationLevels, fieldsOfStudy }, requiredSkills, preferredSkills: [], location, workMode: String(data.get("workMode")),
      deadline: closingDate ? new Date(closingDate).toISOString() : null, applicationMethod: String(data.get("applicationMethod")).trim(), sourceUrl: String(data.get("sourceUrl")).trim(),
      verificationStatus: "pending", source: "org_submitted", status: "open",
    };
    try {
      const response = await fetch("/api/v1/opportunities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) { setMessage({ tone: "error", text: "We could not submit this listing. Check the official link (it must start with https://) and the required fields." }); return; }
      form.reset(); setEducationLevels([]); setFieldsOfStudy([]); setRequiredSkills([]); setLocation("");
      setMessage({ tone: "ok", text: "Submitted. Your listing will be published once our team has reviewed it." });
    } catch { setMessage({ tone: "error", text: "Could not connect. Please check your connection and try again." }); }
  }

  return <form onSubmit={submit} className="mt-6 space-y-5">
    <section className="card grid gap-4 md:grid-cols-2" aria-labelledby="op-basics">
      <h2 id="op-basics" className="text-lg font-extrabold text-ink md:col-span-2">Opportunity details</h2>
      <label className="md:col-span-2"><span className="label">Title</span><input className="field" name="title" required maxLength={160} placeholder="e.g. Programme Officer, Monitoring and Evaluation" /></label>
      <label><span className="label">Type</span><select className="field" name="category" defaultValue="job"><option value="job">Job</option><option value="internship">Internship</option><option value="scholarship">Scholarship</option><option value="fellowship">Fellowship</option><option value="grant">Grant</option><option value="training">Training</option><option value="consultancy">Consultancy</option></select></label>
      <label><span className="label">Work arrangement</span><select className="field" name="workMode" defaultValue="onsite"><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label>
      <ProfileSelect name="location" label="Location" options={choices.location} value={location} onChange={setLocation} allowCustom />
      <label><span className="label">Closing date <span className="font-normal text-navy">(optional)</span></span><input className="field" type="date" name="deadline" min={today} /><span className="mt-1 block text-xs text-navy">Leave blank if applications are accepted until filled.</span></label>
      <label className="md:col-span-2"><span className="label">Description</span><textarea className="field min-h-32" name="description" required placeholder="Describe the role or programme, responsibilities and benefits." /></label>
    </section>
    <section className="card space-y-5" aria-labelledby="op-elig">
      <div><h2 id="op-elig" className="text-lg font-extrabold text-ink">Who can apply</h2><p className="mt-1 text-sm text-navy">Applicants who do not meet these requirements will not see the listing. Leave a section empty if it does not apply.</p></div>
      <ProfileMultiChoice name="educationLevels" label="Accepted education levels" hint="Select all levels you accept." options={education} values={educationLevels} onChange={setEducationLevels} />
      <ProfileMultiChoice name="fieldsOfStudy" label="Accepted fields of study" hint="Select all fields you accept." options={choices.fieldOfStudy} values={fieldsOfStudy} onChange={setFieldsOfStudy} />
      <ProfileMultiChoice name="requiredSkills" label="Required skills" hint="Skills an applicant must have." options={choices.skills} values={requiredSkills} onChange={setRequiredSkills} />
    </section>
    <section className="card grid gap-4" aria-labelledby="op-apply">
      <h2 id="op-apply" className="text-lg font-extrabold text-ink">How to apply</h2>
      <label><span className="label">Application instructions</span><input className="field" name="applicationMethod" required placeholder="e.g. Submit your CV and cover letter on the careers page" /></label>
      <label><span className="label">Official application link</span><input className="field" type="url" name="sourceUrl" required placeholder="https://www.example.org/careers/role" /><span className="mt-1 block text-xs text-navy">Must be on your organization’s own website and start with https://. Applicants are never charged to apply.</span></label>
    </section>
    <div className="flex flex-wrap items-center gap-4"><button className="button" disabled={message?.tone === "busy"}>Submit for review</button>
      {message && <p className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${message.tone === "error" ? "border-[#B3261E]/40 bg-[#B3261E]/10 text-[#7A1A14]" : "border-honey bg-butter text-ink"}`} role="status" aria-live="polite">{message.text}</p>}</div>
  </form>;
}
