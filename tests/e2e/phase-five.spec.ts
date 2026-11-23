import { expect, test } from "@playwright/test";

test("retired publisher pages redirect while discovery stays free", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/dashboard/monetization");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/feed");
  await expect(page.getByRole("link", { name: /View match/ }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
