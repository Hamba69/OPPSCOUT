import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage(): React.JSX.Element {
  return <LegalPage title="Terms of Use">
    <p>These terms apply when you use OppScout. By creating an account you agree to them and to our Privacy Policy.</p>

    <h2>What OppScout does</h2>
    <p>OppScout lists jobs, internships, scholarships, fellowships, grants and training offered by other organisations, and matches them to your profile. We are not the employer or funder, and we do not run their selection. Applications go through each organisation&apos;s own website or process.</p>

    <h2>Listings and matches</h2>
    <p>Our team reviews each listing before publishing it, checking that it comes from the organisation&apos;s own source, is open to people in Uganda, is free to apply for and has a believable deadline. Reviewing is not a guarantee: organisations can change or withdraw opportunities, and details can be wrong, so always check the details on the official page before you apply. Match scores are an estimate of fit based on your profile and do not mean you will be selected. Genuine opportunities never ask you to pay to apply; if one does, do not pay, and use “Report a problem” on the listing.</p>

    <h2>Your account</h2>
    <p>OppScout is only for adults, and you must be 18 or older to create an account or use it. Give accurate information, especially your date of birth and district, because eligibility depends on them. Keep your password private, as you are responsible for what happens under your account. You can delete your account at any time in Settings.</p>

    <h2>Posting opportunities</h2>
    <p>Only post real opportunities that are currently open, with a link to the organisation&apos;s own page. Do not post anything that charges applicants, asks for sensitive personal data it does not need, is misleading, discriminatory or unlawful, or that you are not allowed to share. Give contact details we can reach you on: our review team may contact you before publishing your post, and may edit, decline or remove any post. By posting, you allow OppScout to publish the listing and show it to the people it suits.</p>

    <h2>Acceptable use</h2>
    <p>Do not misuse OppScout. That includes sending spam, scraping, attempting to break its security, impersonating others and collecting other people&apos;s data. We may suspend or close accounts that break these terms.</p>

    <h2>Our responsibility</h2>
    <p>OppScout is provided as it is. We work to keep it accurate and available, but we cannot guarantee that every listing is correct or that the service is always available. As far as the law allows, we are not responsible for decisions made by employers or funders, or for losses that come from relying on a listing without checking the official source.</p>

    <h2>Changes and law</h2>
    <p>We may update these terms. If a change affects you, we will tell you before it takes effect. These terms are governed by the laws of Uganda.</p>
  </LegalPage>;
}
