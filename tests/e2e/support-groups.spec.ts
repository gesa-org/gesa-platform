import { test, expect } from "@playwright/test";

test.describe("Support Groups", () => {
  test("switching tabs updates the preview panel", async ({ page }) => {
    await page.goto("/support-groups");
    await expect(page.getByRole("heading", { name: "Diaspora Voices" })).toBeVisible();

    await page.getByRole("button", { name: /grief companions/i }).click();
    await expect(page.getByText("Dr. Priya Nair")).toBeVisible();
    await expect(page.getByText("GESA Community Room, Berlin")).toBeVisible();
  });

  test("Register opens a modal that collects name/email and can be closed", async ({ page }) => {
    await page.goto("/support-groups");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("heading", { name: /register for/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: /register for/i })).not.toBeVisible();
  });
});
