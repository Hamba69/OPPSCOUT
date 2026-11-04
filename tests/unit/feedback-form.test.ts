// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FeedbackForm } from "@/components/feedback-form";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ submitted: false }) });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("feedback form", () => {
  it("submits the feedback and reports success after a 204 response", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204 });
    render(createElement(FeedbackForm));
    await screen.findByRole("button", { name: "Share feedback" });

    fireEvent.click(screen.getByText("5"));
    fireEvent.change(screen.getByLabelText("Your feedback"), { target: { value: "Please add more opportunities in my region." } });
    fireEvent.click(screen.getByRole("button", { name: "Share feedback" }));

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Thank you"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/feedback");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      category: "idea",
      rating: 5,
      message: "Please add more opportunities in my region.",
      contact: false,
    });
  });

  it("shows the server error when submission fails", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: "Request origin is not allowed." } }),
    });
    render(createElement(FeedbackForm));
    await screen.findByRole("button", { name: "Share feedback" });
    fireEvent.click(screen.getByText("4"));
    fireEvent.change(screen.getByLabelText("Your feedback"), { target: { value: "Please add more opportunities in my region." } });
    fireEvent.click(screen.getByRole("button", { name: "Share feedback" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Request origin is not allowed.");
  });
});
