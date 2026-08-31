import { test, expect } from "@playwright/test";

test.describe("Site navigation", () => {
  // Phase 70 — Roy asked to remove the Home page's gold-band hero text
  // (eyebrow/headline/subtitle/trust badges) and the decorative "gallery
  // wall" of the three path artworks; the page now opens directly with the
  // gold band's background texture, then the three path cards. Updated
  // this assertion accordingly — there's no longer an <h1> on Home at all.
  test("home page renders the core sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /find a therapist/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /reach out now/i }).first()).toBeVisible();
  });

  // Phase 88 — Roy asked to relabel the header nav without changing any
  // route: the link to "/about" now reads "Find Support" (not "About" — the
  // Home link itself now reads "About" instead), "/therapists" now reads
  // "Our Professionals", and "/support-groups" now reads "Community". Only
  // the clicked link names changed below; the destinations and each
  // landing page's own heading are untouched.
  test("header nav links reach the right pages", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Find Support" }).first().click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { name: /the path to emotional recovery begins here/i })).toBeVisible();

    await page.getByRole("link", { name: "Our Professionals" }).first().click();
    await expect(page).toHaveURL(/\/therapists$/);
    await expect(page.getByRole("heading", { name: /verified volunteer therapists/i })).toBeVisible();

    await page.getByRole("link", { name: "Community" }).first().click();
    await expect(page).toHaveURL(/\/support-groups$/);
  });

  // Blog is intentionally disabled (Phase 32) — no header link anymore, and
  // the route itself redirects to Home since there's no content to publish
  // yet. This replaces the old "click Blog in the header" assertion above.
  test("blog is disabled: no header link, and /blog redirects home", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation").getByRole("link", { name: "Blog" })).toHaveCount(0);

    const response = await page.goto("/blog");
    expect(response?.url()).toMatch(/\/$/);
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
