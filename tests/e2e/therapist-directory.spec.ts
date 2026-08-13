import { test, expect } from "@playwright/test";

test.describe("Our Specialists directory", () => {
  test("lists verified therapists with photos and language tags", async ({ page }) => {
    await page.goto("/therapists");
    await expect(page.getByText(/showing \d+ of \d+ therapists/i)).toBeVisible();
    // At least one seeded therapist should render as a card.
    await expect(page.getByRole("heading", { name: "Abi Hartuv" })).toBeVisible();
  });

  test("search filters the grid to matching names only", async ({ page }) => {
    await page.goto("/therapists");
    await page.getByPlaceholder("Search…").fill("Amir");
    await expect(page.getByRole("heading", { name: "Amir Alon" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Abi Hartuv" })).not.toBeVisible();
  });

  test("an unmatched search shows the empty state, not a blank page", async ({ page }) => {
    await page.goto("/therapists");
    await page.getByPlaceholder("Search…").fill("zzzznotarealtherapist");
    await expect(page.getByText(/no therapists match your search/i)).toBeVisible();
  });

  test("language filter narrows results", async ({ page }) => {
    await page.goto("/therapists");
    await page.getByLabel("Language").selectOption("Hebrew");
    await expect(page.getByRole("heading", { name: "Abi Hartuv" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Andy Wang" })).not.toBeVisible();
  });
});
