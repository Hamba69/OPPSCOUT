// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsForm } from "@/components/settings-form";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("account notification preferences", () => {
  it("omits USSD and saves only the available notification channels", async () => {
    render(createElement(SettingsForm, {
      channel: "ussd",
      secondaryChannels: ["ussd", "sms"],
      frequency: "instant",
      enabled: true,
    }));

    const channel = screen.getByLabelText("Best way to reach you") as HTMLSelectElement;
    expect(channel.value).toBe("web");
    expect([...channel.options].map((option) => option.value)).toEqual(["email", "sms", "web"]);
    expect(screen.queryByText("USSD")).toBeNull();
    expect((screen.getByLabelText("SMS") as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      preferredChannel: "web",
      secondaryChannels: ["sms"],
    });
  });
});
