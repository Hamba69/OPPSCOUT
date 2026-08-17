import { expect, test } from "@playwright/test";

test("user sees explained matches, saves one, and updates preferences", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto("/feed");
  await expect(page.getByRole("heading", { name: "Matches worth your time." })).toBeVisible();
  await expect(page.getByText("Why it fits").first()).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/opportunity\//, { timeout: 30_000 }),
    page.getByRole("link", { name: "View match" }).first().click(),
  ]);
  await expect(page.getByRole("heading", { name: "Your match" })).toBeVisible();
  await page.getByRole("button", { name: "Save opportunity" }).click();
  await expect(page.getByText(/Saved\. We’ll help/)).toBeVisible();
  await page.goto("/saved");
  await expect(page.getByText("Junior Data & Impact Internship")).toBeVisible();
  await page.goto("/settings");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Preferences saved.")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("organization submission enters the admin review queue", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto("/dashboard/opportunities/new");
  await page.getByLabel("Opportunity title").fill("Youth Climate Data Fellowship");
  await page.getByLabel("Clear description").fill("A practical fellowship for young Ugandans using community data to support climate resilience projects.");
  await page.getByLabel("Accepted education levels").fill("bachelors");
  await page.getByLabel("Location").fill("Kampala");
  await page.getByLabel("Deadline").fill(new Date(Date.now() + 31 * 86_400_000).toISOString().slice(0, 10));
  await page.getByLabel("How to apply").fill("Complete the official programme form");
  await page.getByLabel("Official HTTPS source").fill("https://example.org/nile-innovation/climate-fellowship");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText(/safely waiting for review/)).toBeVisible();
  await page.goto("/admin/review");
  await expect(page.getByRole("heading", { name: "Youth Climate Data Fellowship" }).first()).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
