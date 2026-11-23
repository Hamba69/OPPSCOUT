import type { Metadata } from "next";

import { OpportunityForm } from "@/components/opportunity-form";
import { requirePageAuth } from "@/lib/auth";
import { defaultPosterContact } from "@/lib/poster-contact";
import { getProfileChoices } from "@/lib/profile-options";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Post an opportunity" };

/** Anyone signed in can share an opportunity. A reviewer checks it, and may contact them, before it goes live. */
export default async function PostOpportunityPage(): Promise<React.JSX.Element> {
  const { userId } = await requirePageAuth(["user", "organization", "admin"]);
  const [choices, contact] = await Promise.all([getProfileChoices(), defaultPosterContact(userId)]);
  return <main className="animate-in flex flex-col gap-5">
    <header className="title-card">
      <h1>Post an opportunity</h1>
      <p>Know of a job, internship, scholarship or grant? Share it here. Our team checks every post, and may contact you, before it reaches people it suits.</p>
    </header>
    <OpportunityForm choices={choices} defaultContact={contact} />
  </main>;
}
