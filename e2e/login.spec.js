import { test, expect } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Stok Takip Sistemi" })).toBeVisible();
  await expect(page.getByLabel("E-posta")).toBeVisible();
  await expect(page.getByLabel("Şifre")).toBeVisible();
});
