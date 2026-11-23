import { expect, test } from "@playwright/test";

test("posting lives in the publisher area, not the seeker app", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "My postings" })).toBeVisible();
  await expect(page.getByText("PUBLISHER")).toBeVisible();
  await page.goto("/dashboard/opportunities/new");
  await expect(page).toHaveURL(/\/dashboard\/new$/);
  await page.goto("/post");
  await expect(page).toHaveURL(/\/dashboard\/new$/);
  await expect(page.getByRole("heading", { name: "Post an opportunity" })).toBeVisible();
  await page.goto("/feed");
  await expect(page.getByRole("link", { name: "Post an opportunity" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "My postings" })).toHaveCount(0);
});

test("one sign-in for everyone, with a way into the publisher area", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Your opportunities stay private." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in to the publisher area" })).toBeVisible();
});
