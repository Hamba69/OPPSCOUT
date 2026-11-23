"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ProfileMultiChoice, ProfileSelect } from "@/components/profile-choice";
import { Icon } from "@/components/app-shell";
import type { Opportunity, SubmitterRelationship } from "@/core/entities/domain";
import { useTransientMessage } from "@/hooks/use-transient-message";
import type { ProfileChoices } from "@/services/profile/choices";
import { apiErrorMessage } from "@/lib/api-error-message";

const EDUCATION_ORDER = ["no formal education", "secondary", "certificate", "diploma", "bachelors", "masters", "phd"];
const OPPORTUNITY_TYPES = [
  ["job", "Job"],
  ["internship", "Internship"],
  ["scholarship", "Scholarship"],
  ["fellowship", "Fellowship"],
  ["grant", "Grant"],
  ["training", "Training"],
  ["consultancy", "Consultancy"],
  ["exhibition", "Exhibition"],
] as const;

const RELATIONSHIPS: Array<[SubmitterRelationship, string]> = [
  ["work_there", "I work at this organisation"],
  ["recruiting_for_them", "I am recruiting on their behalf"],
  ["sharing_public_listing", "I am sharing a public listing I found"],
];

/** Where an opportunity is based: anywhere in Uganda, remote, a district, or (via Other) somewhere abroad. */
function locationOptions(choices: ProfileChoices): ProfileChoices["location"] {
  return [{ value: "Uganda", label: "Anywhere in Uganda" }, { value: "Remote", label: "Remote" }, ...choices.location];
}

/**
 * Post or edit an opportunity. Anyone signed in can post; no organisation account is needed. Every post
 * is checked by a reviewer, who may contact the poster first, so contact details are required.
 */
export function OpportunityForm({ choices, initial, defaultContact }: { choices: ProfileChoices; initial?: Opportunity; defaultContact: { name: string; email: string; phone: string } }): React.JSX.Element {
  const router = useRouter();
  const [message, setMessage] = useTransientMessage<{ tone: "ok" | "error" | "busy"; text: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [educationLevels, setEducationLevels] = useState<string[]>(initial?.eligibility.educationLevels ?? []);
  const [fieldsOfStudy, setFieldsOfStudy] = useState<string[]>(initial?.eligibility.fieldsOfStudy ?? []);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(initial?.requiredSkills ?? []);
  const [location, setLocation] = useState(initial?.location ?? "");
  const [relationship, setRelationship] = useState<SubmitterRelationship | "">(initial?.submitterContact?.relationship ?? "");
  const contact = initial?.submitterContact ?? { ...defaultContact, relationship: "" };
  const education = useMemo(() => [...choices.educationLevel].sort((a, b) => EDUCATION_ORDER.indexOf(a.value) - EDUCATION_ORDER.indexOf(b.value)), [choices.educationLevel]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const selectedType = OPPORTUNITY_TYPES.find(([value]) => value === initial?.category)?.[0] ?? "job";

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!location) { setMessage({ tone: "error", text: "Select the location of the opportunity." }); return; }
    if (!relationship) { setMessage({ tone: "error", text: "Tell us how you are connected to this opportunity." }); return; }
    const form = event.currentTarget; const data = new FormData(form);
    setMessage({ tone: "busy", text: initial ? "Saving changes…" : "Submitting for review…" });
    setSubmitting(true);
    const closingDate = String(data.get("deadline") ?? "");
    const body = {
      title: String(data.get("title")).trim(), organizationName: String(data.get("organizationName")).trim(), category: String(data.get("category")), description: String(data.get("description")).trim(),
      eligibility: { ...initial?.eligibility, educationLevels, fieldsOfStudy }, requiredSkills, preferredSkills: initial?.preferredSkills ?? [], location, workMode: String(data.get("workMode")),
      ...(!initial || closingDate !== (initial.deadline?.toISOString().slice(0, 10) ?? "") ? { deadline: closingDate ? new Date(closingDate).toISOString() : null } : {}),
      applicationMethod: String(data.get("applicationMethod")).trim(), sourceUrl: String(data.get("sourceUrl")).trim(),
      submitterContact: { name: String(data.get("contactName")).trim(), email: String(data.get("contactEmail")).trim(), phone: String(data.get("contactPhone")).trim(), relationship },
    };
    try {
      const response = await fetch(initial ? `/api/v1/opportunities/${initial.id}` : "/api/v1/opportunities", { method: initial ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) { setMessage({ tone: "error", text: await apiErrorMessage(response, initial ? "We could not save these changes. Check the official link and required fields." : "We could not submit this listing. Check the official link (it must start with https://) and the required fields.") }); return; }
      setMessage({ tone: "ok", text: initial ? "Changes saved and sent for review again." : "Submitted. A reviewer will check it, and may contact you, before it goes live." });
      router.push(`/my-postings?${initial ? "updated" : "posted"}=1`);
      router.refresh();
      return;
    } catch { setMessage({ tone: "error", text: "Could not connect. Please check your connection and try again." }); }
    finally { setSubmitting(false); }
  }

  return <form onSubmit={submit} className="space-y-5">
    <section className="surface grid gap-4 md:grid-cols-2" aria-labelledby="op-basics">
      <h2 id="op-basics" className="text-[17px] font-bold text-ink md:col-span-2">Opportunity details</h2>
      <label className="md:col-span-2"><span className="label">Title</span><input className="field" name="title" required maxLength={160} defaultValue={initial?.title} placeholder="e.g. Programme Officer, Monitoring and Evaluation" /></label>
      <label className="md:col-span-2"><span className="label">Organisation offering it</span><input className="field" name="organizationName" required maxLength={180} defaultValue={initial?.organization?.name ?? initial?.organizationName ?? ""} placeholder="e.g. Makerere University, UNICEF Uganda, Kampala Capital City Authority" /><span className="mt-1 block text-xs text-navy">The employer, funder or school, as applicants will see it.</span></label>
      <fieldset className="md:col-span-2">
        <legend className="label">Type</legend>
        <div className="flex flex-wrap gap-2">
          {OPPORTUNITY_TYPES.map(([value, label]) => (
            <label key={value} className="chip cursor-pointer">
              <input className="sr-only" type="radio" name="category" value={value} defaultChecked={selectedType === value} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <ProfileSelect name="location" label="Location" options={locationOptions(choices)} value={location} onChange={setLocation} allowCustom />
      <label><span className="label">Work arrangement</span><select className="field" name="workMode" defaultValue={initial?.workMode ?? "onsite"}><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label>
      <label className="md:col-span-2"><span className="label">Description</span><textarea className="field min-h-32" name="description" required defaultValue={initial?.description} placeholder="Describe the role or programme, responsibilities and benefits." /></label>
    </section>
    <section className="surface space-y-5" aria-labelledby="op-elig">
      <div><h2 id="op-elig" className="text-[17px] font-bold text-ink">Who can apply</h2><p className="mt-1 text-sm text-navy">Applicants who do not meet these requirements will not see the listing. Leave a section empty if it does not apply.</p></div>
      <ProfileMultiChoice name="educationLevels" label="Accepted education levels" hint="Select all levels you accept." options={education} values={educationLevels} onChange={setEducationLevels} />
      <ProfileMultiChoice name="fieldsOfStudy" label="Accepted fields of study" hint="Select all fields you accept." options={choices.fieldOfStudy} values={fieldsOfStudy} onChange={setFieldsOfStudy} />
      <ProfileMultiChoice name="requiredSkills" label="Required skills" hint="Skills an applicant must have." options={choices.skills} values={requiredSkills} onChange={setRequiredSkills} />
    </section>
    <section className="surface grid gap-4 md:grid-cols-2" aria-labelledby="op-apply">
      <h2 id="op-apply" className="text-[17px] font-bold text-ink md:col-span-2">How to apply</h2>
      <label><span className="label">Official application link</span><input className="field" type="url" name="sourceUrl" required defaultValue={initial?.sourceUrl} placeholder="https://www.example.org/careers/role" /><span className="mt-1 block text-xs text-navy">The organisation’s own page for this opportunity, starting with https://. Listings that charge applicants a fee are not accepted.</span></label>
      <label><span className="label">Closing date <span className="font-normal text-navy">(optional)</span></span><input className="field" type="date" name="deadline" min={initial?.deadline && initial.deadline.toISOString().slice(0, 10) < today ? undefined : today} defaultValue={initial?.deadline?.toISOString().slice(0, 10) ?? ""} /><span className="mt-1 block text-xs text-navy">Leave blank if applications are accepted until filled.</span></label>
      <label className="md:col-span-2"><span className="label">Application instructions</span><input className="field" name="applicationMethod" required defaultValue={initial?.applicationMethod} placeholder="e.g. Submit your CV and cover letter on the careers page" /></label>
    </section>
    <section className="surface grid gap-4 md:grid-cols-2" aria-labelledby="op-contact">
      <div className="md:col-span-2"><h2 id="op-contact" className="text-[17px] font-bold text-ink">Your contact details</h2><p className="mt-1 text-sm text-navy">Only the OppScout review team sees these. A reviewer may call, email or WhatsApp you to confirm the opportunity before it goes live.</p></div>
      <label><span className="label">Your name</span><input className="field" name="contactName" required maxLength={120} autoComplete="name" defaultValue={contact.name} /></label>
      <label><span className="label">Phone or WhatsApp number</span><input className="field" type="tel" name="contactPhone" required autoComplete="tel" defaultValue={contact.phone} placeholder="+256 700 000000" /></label>
      <label className="md:col-span-2"><span className="label">Email</span><input className="field" type="email" name="contactEmail" required autoComplete="email" defaultValue={contact.email} /></label>
      <fieldset className="md:col-span-2">
        <legend className="label">How are you connected to this opportunity?</legend>
        <div className="mt-1 flex flex-col gap-2">
          {RELATIONSHIPS.map(([value, label]) => <label key={value} className="flex items-center gap-3 text-sm text-ink"><input type="radio" name="relationship" value={value} checked={relationship === value} onChange={() => setRelationship(value)} className="size-4 accent-leaf" />{label}</label>)}
        </div>
      </fieldset>
    </section>
    <div className="flex flex-wrap items-center justify-end gap-4"><button className="button" disabled={submitting}><Icon name="check" size={16} />{submitting ? "Please wait…" : initial ? "Save changes" : "Submit for review"}</button>
      {message && <p className={`text-sm font-semibold ${message.tone === "error" ? "text-[#B3261E]" : "text-[#6B4E00]"}`} role="status" aria-live="polite">{message.text}</p>}</div>
  </form>;
}
