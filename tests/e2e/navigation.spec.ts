import { test, expect } from "@playwright/test";

test.describe("Site navigation", () => {
  test("home page renders the hero and core sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /find a therapist/i })).toBeVisible();
    await expect(page.getByText("Two clicks to support")).toBeVisible();
  });

  test("header nav links reach the right pages", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { name: "Who We Are" })).toBeVisible();

    await page.getByRole("link", { name: "Our Therapists" }).click();
    await expect(page).toHaveURL(/\/therapists$/);
    await expect(page.getByRole("heading", { name: /verified volunteer therapists/i })).toBeVisible();

    await page.getByRole("link", { name: "Support Groups" }).click();
    await expect(page).toHaveURL(/\/support-groups$/);

    await page.getByRole("link", { name: "Blog" }).click();
    await expect(page).toHaveURL(/\/blog$/);
  });

  test("footer legal links resolve without 404s", async ({ page }) => {
    await page.goto("/");
    for (const slug of [
      "privacy-policy",
      "cookies-policy",
      "legal-notice",
      "accessibility-statement",
      "terms-and-conditions",
    ]) {
      const response = await page.request.get(`/${slug}`);
      expect(response.status(), `${slug} should resolve`).toBeLessThan(400);
    }
  });

  test("crisis button opens the resource modal", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /in crisis/i }).click();
    await expect(page.getByText("You are not alone")).toBeVisible();
    await expect(page.getByRole("link", { name: /988 suicide/i })).toBeVisible();
  });
});
