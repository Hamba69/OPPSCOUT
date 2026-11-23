import { expect, test } from "@playwright/test";

test("user sees scored matches, saves one, and updates preferences", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto("/feed");
  await expect(page.getByRole("heading", { name: "Matches worth your time." })).toBeVisible();
  await expect(page.locator(".match-score").first()).toHaveText(/\d+% match/);
  await expect(page.getByText("Why it fits")).toHaveCount(0);
  const savedTitle = await page.locator("article").first().getByRole("heading", { level: 2 }).textContent();
  expect(savedTitle).toBeTruthy();
  await Promise.all([
    page.waitForURL(/\/opportunity\//, { timeout: 30_000 }),
    page.getByRole("link", { name: "View match" }).first().click(),
  ]);
  await expect(page.getByRole("heading", { name: "Your match" })).toBeVisible();
  await page.getByRole("button", { name: "Save opportunity" }).click();
  await expect(page.getByText(/Saved\. We’ll help/)).toBeVisible();
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: savedTitle! })).toBeVisible();
  await page.goto("/settings");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Preferences saved.")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("any signed-in member can post an opportunity, and it waits in the review queue", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto("/dashboard/new");
  await page.getByLabel("Title").fill("Youth Climate Data Fellowship");
  await page.getByLabel("Organisation offering it").fill("Nile Innovation");
  await page.getByLabel("Location").selectOption("Kampala");
  await page.getByLabel("Description").fill("A practical fellowship for young Ugandans using community data to support climate resilience projects.");
  await page.getByLabel("Official application link").fill("https://example.org/nile-innovation/climate-fellowship");
  await page.getByLabel("Closing date").fill(new Date(Date.now() + 31 * 86_400_000).toISOString().slice(0, 10));
  await page.getByLabel("Application instructions").fill("Complete the official programme form");
  await page.getByLabel("Your name").fill("Amina Nakato");
  await page.getByLabel("Phone or WhatsApp number").fill("+256 700 000001");
  await page.getByLabel("Email").fill("amina@example.org");
  await page.getByLabel("I work at this organisation").check();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await page.waitForURL("**/dashboard?posted=1");
  await expect(page.getByText("Thanks, your opportunity was submitted.")).toBeVisible();
  await expect(page.getByText("Youth Climate Data Fellowship")).toBeVisible();
  await page.goto("/admin/review");
  await expect(page.getByText("Youth Climate Data Fellowship").first()).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
