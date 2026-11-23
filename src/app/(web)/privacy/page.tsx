import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage } from "@/components/legal-page";
import { LEGAL } from "@/config/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage(): React.JSX.Element {
  return <LegalPage title="Privacy Policy">
    <p>OppScout helps people in Uganda find jobs, internships, scholarships, fellowships, grants and training that fit them. This page explains what personal data we collect, why, who we share it with and the choices you have. We follow Uganda&apos;s Data Protection and Privacy Act, 2019 and its Regulations of 2021.{LEGAL.pdpoRegistration ? ` We are registered with the Personal Data Protection Office (registration number ${LEGAL.pdpoRegistration}).` : ""}</p>

    <h2>What we collect</h2>
    <ul>
      <li><strong>Your account:</strong> email address and password (stored only in scrambled form).</li>
      <li><strong>Your profile:</strong> name, email, phone number, date of birth, the district you live in, education, field of study, institution, skills, languages, certifications, work and internship experience, links, projects and the kinds of opportunities and places you prefer.</li>
      <li><strong>Documents you upload</strong> to your profile.</li>
      <li><strong>How you use OppScout:</strong> the matches we show you, what you save, view, click and report, and the notifications we send.</li>
      <li><strong>Opportunities you post:</strong> the listing, plus your name, email, phone number and how you are connected to it.</li>
      <li><strong>Feedback:</strong> your message and rating, and, only if you choose to be contacted, your email. To stop repeat submissions we keep scrambled (hashed) identifiers for your browser and network, not your IP address itself.</li>
      <li><strong>USSD:</strong> your phone number and a scrambled PIN.</li>
      <li><strong>Technical data:</strong> page speed, errors and anonymous usage statistics, so we can keep the service working.</li>
    </ul>

    <h2>Why we use it</h2>
    <ul>
      <li>To match you with opportunities you are eligible for. Your date of birth is required because some opportunities have age limits, and your district because many are tied to a place.</li>
      <li>To send the alerts you ask for, by email, SMS or in the app, and deadline reminders for opportunities you saved.</li>
      <li>To review opportunities before they are published. If you post one, our review team may call, email or WhatsApp you to confirm it.</li>
      <li>To keep OppScout safe: preventing spam and abuse, and investigating reports.</li>
      <li>To improve OppScout using statistics that do not identify you.</li>
    </ul>
    <p>We use your data only with your consent, which you give when you create an account, or where we need it to provide the service you asked for. We do not sell your personal data, and we do not show your profile, contact details or documents to employers or other organisations.</p>

    <h2>Who we share it with</h2>
    <p>Only service providers that run OppScout for us, under contract, and only what each needs:</p>
    <ul>
      <li><strong>Supabase:</strong> database, sign-in and file storage.</li>
      <li><strong>Vercel:</strong> website hosting, and anonymous analytics and speed measurements.</li>
      <li><strong>Resend:</strong> sending emails.</li>
      <li><strong>Africa&apos;s Talking:</strong> SMS alerts and the USSD service.</li>
      <li><strong>Upstash:</strong> limiting repeated requests, to block abuse.</li>
      <li><strong>Anthropic:</strong> only if we switch on AI-assisted matching, a summary of your profile (not your name or contact details) and of the opportunity is sent to rank the match.</li>
    </ul>
    <p>We may also disclose data when the law requires it.</p>

    <h2>Storage outside Uganda</h2>
    <p>Some of these providers store or process data on servers outside Uganda. When you create an account, you agree to this. They are required to protect your data at least as well as Ugandan law requires.</p>

    <h2>How long we keep it</h2>
    <ul>
      <li>Your account, profile and activity: until you delete your account.</li>
      <li>Detailed page-speed and request records: 30 days. Matching run records: 180 days. After that we keep only daily totals.</li>
      <li>Opportunities you posted stay published until they close or you remove them; your contact details are removed with your account.</li>
    </ul>

    <h2>Your rights</h2>
    <p>Under Ugandan law you can ask to see the data we hold about you, have it corrected or deleted, and object to or stop processing that harms you. You can do most of this yourself:</p>
    <ul>
      <li>Edit your details on <Link className="underline" href="/profile">My profile</Link>.</li>
      <li>Download a copy of your data, or delete your account, in <Link className="underline" href="/settings">Settings</Link>.</li>
      <li>Turn alerts on or off in Settings.</li>
    </ul>
    <p>For anything else, contact us below. If you are not satisfied with our answer, you can complain to Uganda&apos;s Personal Data Protection Office (pdpo.go.ug).</p>

    <h2>Security</h2>
    <p>Data is encrypted in transit, passwords and PINs are stored only in scrambled form, and access to personal data is limited to the people who need it. If a breach puts your data at risk, we will tell you and the Personal Data Protection Office as the law requires.</p>

    <h2>Children</h2>
    <p>You must be at least 13 to use OppScout. If you are under 18, please use it with a parent or guardian&apos;s knowledge.</p>

    <h2>Changes</h2>
    <p>If we change this policy in a way that affects you, we will tell you in the app or by email before the change takes effect.</p>
  </LegalPage>;
}
