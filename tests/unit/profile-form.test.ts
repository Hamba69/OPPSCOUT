// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileForm, type ProfileFormInitial } from "@/components/profile-form";
import { profileSchema } from "@/lib/validation";
import { buildProfileChoices } from "@/services/profile/choices";
import { getDemoCatalog } from "@/data/demo-catalog";
import { DEMO_USER_ID, MemoryRepository } from "@/lib/repository/memory";
import { buildRankedFeed } from "@/services/matching/feed";
import { OrbitMatchEngine } from "@/services/matching/orbit/engine";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), fetch: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
const initial: ProfileFormInitial = { institution: "", certifications: [], workExperience: [], internshipExperience: [], name: "Nadia Kato", email: "", phone: "", educationLevel: "", fieldOfStudy: "", graduationStatus: "", dateOfBirth: "", location: "", skills: [], careerInterests: [], preferredLocations: [], opportunityCategories: [], languages: [], workModePreference: "" };
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("fetch", mocks.fetch); mocks.fetch.mockResolvedValue({ ok: true }); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("selectable matching profile", () => {
  it("saves experience and certifications while preserving organization details", async () => {
    render(createElement(ProfileForm, { choices: buildProfileChoices(getDemoCatalog().opportunities), isNew: false, nextPath: "/feed", initial: { ...initial, certifications: ["CPA (U)"], workExperience: [{ title: "Analyst", organization: "Prior employer", months: 48 }] } }));
    fireEvent.change(within(screen.getByRole("group", { name: "Work experience 1" })).getByLabelText(/^Years/), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Add internship" }));
    fireEvent.change(within(screen.getByRole("group", { name: "Internships 1" })).getByLabelText(/Job title/), { target: { value: "Research intern" } });
    fireEvent.change(within(screen.getByRole("group", { name: "Internships 1" })).getByLabelText(/^Months/), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalled());
    const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
    expect(body.workExperience).toEqual([{ title: "Analyst", organization: "Prior employer", months: 60 }]);
    expect(body.internshipExperience).toEqual([{ title: "Research intern", months: 6 }]);
    expect(body.certifications).toEqual(["CPA (U)"]);
    expect(profileSchema.safeParse(body).success).toBe(true);
  });
  it("sends exact scalar and array values, retaining selected skills after searching", async () => {
    render(createElement(ProfileForm, { choices: buildProfileChoices(getDemoCatalog().opportunities), isNew: false, nextPath: "/feed", initial }));
    fireEvent.change(screen.getByLabelText("Highest education level"), { target: { value: "bachelors" } });
    fireEvent.change(screen.getByLabelText("Field of study"), { target: { value: "computer science" } });
    fireEvent.change(screen.getByLabelText("Study status"), { target: { value: "graduated" } });
    fireEvent.change(screen.getByLabelText("Current location"), { target: { value: "Kampala" } });
    fireEvent.change(screen.getByLabelText("Search skills"), { target: { value: "javascript" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "JavaScript" }));
    fireEvent.change(screen.getByLabelText("Search skills"), { target: { value: "sql" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "SQL" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "English" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Jobs" }));
    fireEvent.change(screen.getByLabelText(/^Work arrangement/), { target: { value: "hybrid" } });
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalled());
    const [path, request] = mocks.fetch.mock.calls[0];
    expect(path).toBe("/api/v1/profile");
    const body = JSON.parse(request.body);
    expect(body).toMatchObject({ educationLevel: "bachelors", fieldOfStudy: "computer science", graduationStatus: "graduated", location: "Kampala", skills: ["javascript", "sql"], languages: ["English"], opportunityCategories: ["job"], workModePreference: "hybrid" });
    expect(body.careerInterests).toEqual([]);
    const repo = new MemoryRepository();
    const saved = await repo.updateProfile(DEMO_USER_ID, profileSchema.parse(body));
    expect(saved.skills).toEqual(["javascript", "sql"]);
    const matches = await buildRankedFeed(repo, DEMO_USER_ID, new Date(), new OrbitMatchEngine());
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((match) => match.score >= 0 && match.score <= 100)).toBe(true);
  });

  it("preserves existing custom values and allows removing a selected entry", async () => {
    render(createElement(ProfileForm, { choices: buildProfileChoices(getDemoCatalog().opportunities), isNew: false, nextPath: "/feed", initial: { ...initial, educationLevel: "legacy qualification", location: "My village", skills: ["rare craft", "research"], languages: ["Custom language"], preferredLocations: ["Kampala, Uganda"] } }));
    expect((screen.getByLabelText("Highest education level") as HTMLSelectElement).value).toBe("legacy qualification");
    fireEvent.click(screen.getByRole("button", { name: "Remove Research" }));
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalled());
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toMatchObject({ educationLevel: "legacy qualification", location: "My village", skills: ["rare craft"], languages: ["Custom language"], preferredLocations: ["Kampala, Uganda"] });
  });

  it("keeps choices on a failed save and displays a save error", async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { details: { fieldErrors: { skills: ["Please review your skill entries."] } } } }) });
    render(createElement(ProfileForm, { choices: buildProfileChoices(getDemoCatalog().opportunities), isNew: false, nextPath: "/feed", initial: { ...initial, skills: ["javascript"] } }));
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("We could not save your profile."));
    expect(screen.getByRole("button", { name: "Remove JavaScript" })).toBeTruthy();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("saves an unlisted location as its real value rather than the UI sentinel", async () => {
    render(createElement(ProfileForm, { choices: buildProfileChoices(getDemoCatalog().opportunities), isNew: false, nextPath: "/feed", initial }));
    fireEvent.change(screen.getByLabelText("Current location"), { target: { value: "__custom" } });
    fireEvent.change(screen.getByLabelText("Your location"), { target: { value: "Nansana" } });
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalled());
    const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
    expect(body.location).toBe("Nansana");
    expect(profileSchema.safeParse(body).success).toBe(true);
  });
});
