import { expect, test } from "@playwright/test";

test("old publisher links lead to the member posting pages", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/my-postings$/);
  await expect(page.getByRole("heading", { name: "My postings" })).toBeVisible();
  await page.goto("/dashboard/opportunities/new");
  await expect(page).toHaveURL(/\/post$/);
  await page.goto("/onboarding/organization");
  await expect(page).toHaveURL(/\/post$/);
  await expect(page.getByRole("heading", { name: "Post an opportunity" })).toBeVisible();
  await page.goto("/admin/kpis");
  await expect(page.getByRole("heading", { name: "Ten KPIs, no guesswork." })).toBeVisible();
});

test("one sign-in for everyone, with no separate publisher login", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Your opportunities stay private." })).toBeVisible();
  await expect(page.getByText("Publisher log in")).toHaveCount(0);
});
