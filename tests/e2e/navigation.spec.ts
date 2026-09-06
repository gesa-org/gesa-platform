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
  // route: the link to "/about" read "Find Support" (not "About" — the
  // Home link itself reads "About" instead), "/therapists" reads "Our
  // Professionals", and "/support-groups" reads "Community".
  //
  // Phase 145 — Roy reversed the Phase 144 "About Us" nav item entirely:
  // the About page's content now renders AT /find-your-therapist (see
  // app/find-your-therapist/page.tsx), "/about" is just a permanent
  // redirect to that same URL (next.config.mjs), and there is exactly one
  // nav link for this destination ("Find Support") — no separate "About
  // Us" link exists anywhere anymore, so that assertion is replaced with a
  // check that "/about" redirects instead of a second nav link to click.
  test("header nav links reach the right pages", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Find Support" }).first().click();
    await expect(page).toHaveURL(/\/find-your-therapist$/);
    await expect(page.getByRole("heading", { name: /emotional support should feel human/i })).toBeVisible();

    await expect(page.getByRole("navigation").getByRole("link", { name: "About Us" })).toHaveCount(0);

    await page.getByRole("link", { name: "Our Professionals" }).first().click();
    await expect(page).toHaveURL(/\/therapists$/);
    await expect(page.getByRole("heading", { name: /verified volunteer therapists/i })).toBeVisible();

    await page.getByRole("link", { name: "Community" }).first().click();
    await expect(page).toHaveURL(/\/support-groups$/);
  });

  // Phase 145 — /about used to be a real, separate page; it's now a
  // permanent (308) redirect to /find-your-therapist so old links/bookmarks
  // still land somewhere real instead of a 404.
  test("/about redirects permanently to /find-your-therapist", async ({ page }) => {
    const response = await page.goto("/about");
    expect(response?.url()).toMatch(/\/find-your-therapist$/);
    await expect(page.getByRole("heading", { name: /emotional support should feel human/i })).toBeVisible();
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
