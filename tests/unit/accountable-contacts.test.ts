// @vitest-environment jsdom
import { createElement, useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AccountableContactsFields } from "@/components/accountable-contacts-fields";
import { organizationPatchSchema, organizationSchema } from "@/lib/validation";

afterEach(cleanup);

function AccountableContactsHarness(): React.JSX.Element {
  const [contacts, setContacts] = useState([{ name: "Amina Nakato", phone: "+256 700 000000" }]);
  return createElement(AccountableContactsFields, { contacts, onChange: setContacts });
}

describe("accountable contacts", () => {
  it("requires a name and phone for the first contact and allows additional contacts", () => {
    render(createElement(AccountableContactsHarness));

    expect((screen.getByLabelText("Name") as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText("Phone number") as HTMLInputElement).required).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "+ Add contact" }));

    expect(screen.getAllByLabelText("Name")).toHaveLength(2);
    expect(screen.getAllByLabelText("Phone number")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Remove contact 2" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove contact 2" }));
    expect(screen.getAllByLabelText("Name")).toHaveLength(1);
  });

  it("requires at least one complete contact in organization submissions and patches", () => {
    const organization = {
      name: "Example Publisher",
      sector: "Education",
      officialLinks: ["https://example.org"],
      officialEmail: "careers@example.org",
      registrationProof: "REG-12345",
    };

    expect(organizationSchema.safeParse(organization).success).toBe(false);
    expect(organizationSchema.safeParse({
      ...organization,
      accountableContacts: [{ name: "Amina Nakato", phone: "+256 700 000000" }],
    }).success).toBe(true);
    expect(organizationPatchSchema.safeParse({ accountableContacts: [] }).success).toBe(false);
    expect(organizationPatchSchema.safeParse({
      accountableContacts: [{ name: "Amina Nakato", phone: "+256 700 000000" }],
    }).success).toBe(true);
  });
});
