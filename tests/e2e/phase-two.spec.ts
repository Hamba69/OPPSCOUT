import { expect, test } from "@playwright/test";

test("posting lives in the publisher area, with the same menu shape as the seeker app", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "My postings" })).toBeVisible();
  const menu = page.getByRole("complementary");
  await expect(menu.getByRole("link", { name: "Post an opportunity" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Publisher profile" })).toBeVisible();
  // Switching to finding opportunities is on the publisher profile page, not in the menu.
  await expect(menu.getByRole("link", { name: /find/i })).toHaveCount(0);
  await page.goto("/dashboard/profile");
  await expect(page.getByRole("link", { name: "Switch to finding opportunities" })).toBeVisible();
  await page.goto("/dashboard/opportunities/new");
  await expect(page).toHaveURL(/\/dashboard\/new$/);
  await page.goto("/post");
  await expect(page).toHaveURL(/\/dashboard\/new$/);
  await expect(page.getByRole("heading", { name: "Post an opportunity" })).toBeVisible();
});

test("the seeker app has no posting in its menu; switching is in Settings", async ({ page }) => {
  await page.goto("/feed");
  await expect(page.getByRole("link", { name: "Post an opportunity" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "My postings" })).toHaveCount(0);
  await page.goto("/settings");
  await expect(page.getByRole("link", { name: "Switch to publishing" })).toBeVisible();
});

test("one sign-in for everyone", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Your opportunities stay private." })).toBeVisible();
  await expect(page.getByText(/publisher/i)).toHaveCount(0);
});
