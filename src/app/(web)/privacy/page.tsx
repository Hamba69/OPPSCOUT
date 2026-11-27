import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage(): React.JSX.Element {
  return <LegalPage title="Privacy Policy">
    <p>OppScout helps adults in Uganda find jobs, internships, scholarships, fellowships, grants and training that fit them. This policy explains what personal data we collect, the lawful basis for using it, who receives it and the choices you have. It is written for Uganda&apos;s Data Protection and Privacy Act, 2019 and its Regulations of 2021.</p>

    <h2>What we collect</h2>
    <p>When you create an account we collect your email address and a password, which is stored only in scrambled form. Your profile holds your name, email, phone number, date of birth, the district you live in, your education, field of study and institution, your skills, languages and certifications, your work and internship experience, any links and projects you add, and the kinds of opportunities and places you prefer. We also keep any documents you upload to your profile.</p>
    <p>As you use OppScout we record the matches we show you, what you save, view, click and report, and the notifications we send you. If you post an opportunity, we keep the listing together with your name, email, phone number and how you are connected to it. If you send feedback, we keep your message and rating and, only if you choose to be contacted, your email; to stop repeat submissions we keep scrambled identifiers for your browser and network rather than your IP address itself. If you use the USSD service, we keep your phone number and a scrambled PIN. We also collect technical data such as page speed, errors and anonymous usage statistics so that we can keep the service working.</p>

    <h2>Why we use it</h2>
    <p>We use profile data to decide which opportunities you may be eligible for, produce a match explanation and send the notification choices you make. Your date of birth is used for age gates and your district or preferred locations for location-relevant opportunities. When you apply or share your profile, we use the information you choose to provide for that purpose.</p>
    <p>Before an opportunity is published, our review team checks it, and if you posted it they may call, email or message you to confirm it. We use limited data to prevent spam and abuse, investigate reports, maintain service security and produce aggregate service statistics.</p>
    <p>Our primary bases are your consent and the need to provide the OppScout service you request. Legitimate safety, security and legal obligations may also require processing. We do not sell personal data. Employers and organisations do not receive your profile, contact details or documents unless you have opted in and made an application or other recorded sharing action.</p>

    <h2>Who we share it with</h2>
    <p>We share data only with service providers that run OppScout for us under contract, and each receives only what it needs. Supabase provides our database, sign-in and file storage. Vercel hosts the website and provides anonymous analytics and speed measurements. Resend sends our emails. Africa&apos;s Talking delivers SMS alerts and runs the USSD service. Upstash limits repeated requests so that we can block abuse. If we switch on AI-assisted matching, Anthropic receives a summary of your profile, without your name or contact details, together with a summary of the opportunity, in order to rank the match. We may also disclose data when the law requires it.</p>

    <h2>Storage outside Uganda</h2>
    <p>Some of these providers store or process data on servers outside Uganda, and by creating an account you agree to this. They are required to protect your data at least as well as Ugandan law requires.</p>

    <h2>How long we keep it</h2>
    <p>We keep account and profile data until you delete the account or ask us to remove it, subject to a limited retention period for records we must keep for a legal, safety or accounting purpose. Detailed page-speed and request records are kept for 30 days and matching run records for 180 days, after which only aggregate totals remain. Feedback and security records are retained only as long as needed to investigate and resolve abuse or complaints.</p>
    <p>Opportunities you post stay published until they close or you remove them. Your poster contact details are removed when your account is deleted unless that information must remain attached to a public or in-progress listing for accountability or evidence.</p>

    <h2>Your rights</h2>
    <p>Subject to Ugandan law and applicable exceptions, you may request access to the personal data we hold, correction of inaccurate data, deletion, restriction or withdrawal of consent, and an explanation of an automated or significant decision. You can edit profile details, download an account copy, delete the account and change notification choices in Settings. To use another right or to ask a question, contact us using the details below.</p>
    <p>If you believe we have not handled a request appropriately, you may complain to Uganda&apos;s Personal Data Protection Office through the official channel published by that office.</p>

    <h2>Security</h2>
    <p>Data is encrypted in transit, passwords and PINs are stored only in scrambled form, and access to personal data is limited to the people who need it. If a breach puts your data at risk, we will tell you as the law requires.</p>

    <h2>Who can use OppScout</h2>
    <p>OppScout is only for adults. You must be 18 or older to create an account or use the service, and we do not knowingly collect data from anyone under 18. If we learn that an account belongs to someone under 18, we will close it and delete their data.</p>

    <h2>Changes</h2>
    <p>If we change this policy in a way that affects you, we will tell you in the app or by email before the change takes effect.</p>
  </LegalPage>;
}
