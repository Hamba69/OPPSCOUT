import { OrganizationForm } from "@/components/organization-form";
import { requirePageAuth } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function OrganizationPage(): Promise<React.JSX.Element> {
  const auth = await requirePageAuth(["organization"]);
  const organization = await (await getRepository()).getOrganization(auth.organizationId!);
  if (!organization) throw new Error("Publisher profile is missing.");

  return (
    <main className="animate-in flex flex-col gap-5">
      <header className="title-card">
        <h1>Publisher profile</h1>
        <p>Keep the organization details used to verify your publisher account current.</p>
      </header>
      <OrganizationForm
        id={organization.id}
        name={organization.name}
        sector={organization.sector}
        officialLinks={organization.officialLinks}
        officialEmail={organization.officialEmail}
        registrationProof={organization.registrationProof}
        accountableContact={organization.accountableContact}
        accountableContacts={organization.accountableContacts}
        additionalAccountableContact={organization.additionalAccountableContact ?? null}
        additionalAccountableContactPhone={organization.additionalAccountableContactPhone ?? null}
      />
    </main>
  );
}
