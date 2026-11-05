import { expect, test } from "@playwright/test";
test("publisher analytics stays hidden while organization details remain available", async ({ page }) => { const errors: string[] = []; page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); }); await page.goto("/dashboard/analytics"); await expect(page).toHaveURL(/\/dashboard$/); await expect(page.getByText("Publisher workspace", { exact: true })).toBeVisible(); await expect(page.getByRole("link", { name: "Analytics" })).toHaveCount(0); await page.goto("/dashboard/organization"); await expect(page.getByRole("heading", { name: "Publisher profile" })).toBeVisible(); await expect(page.getByLabel("Organization name")).toBeVisible(); await page.goto("/admin/kpis"); await expect(page.getByRole("heading", { name: "Ten KPIs, no guesswork." })).toBeVisible(); await expect(page.locator("section.card")).toHaveCount(10); expect(errors).toEqual([]); });

test("account entry and provider onboarding are complete user journeys", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Your opportunities stay private." })).toBeVisible();
  await page.goto("/onboarding/organization");
  await page.getByLabel("Organization name").fill("Community Skills Uganda");
  await page.getByLabel("Sector").fill("Youth employment");
  await page.getByLabel("Official website").fill("https://example.org/community-skills");
  await page.getByLabel("Official email").fill("team@example.org");
  await page.getByLabel("Accountable contact").fill("Programme Director");
  await page.getByLabel("Registration or institutional proof").fill("UG-NGO-9001");
  await page.getByRole("button", { name: "Create organization" }).click();
  await page.waitForURL("**/dashboard");
  await page.goto("/admin/review");
  await expect(page.getByRole("heading", { name: "Community Skills Uganda" })).toBeVisible();
});
