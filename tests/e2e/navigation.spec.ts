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
  // Home link itself read "About" instead), "/therapists" reads "Our
  // Professionals", and "/support-groups" reads "Community".
  //
  // Phase 145 reversed the Phase 144 "About Us" nav item entirely: the
  // About page's content moved to render AT /find-your-therapist, "/about"
  // became a permanent redirect to that URL, and the "About" nav label
  // (homeLabel) pointed at "/" (Home) instead of a real About page — which
  // is exactly the confusion the next phase below was asked to fix.
  //
  // Phase 215 (this test's own update) — Roy flagged that having "About"
  // click through to Home (same page, same interface) was confusing, and
  // asked for About and Home to be genuinely distinct again: the "About"
  // nav link now routes to a real `/about` page containing everything that
  // used to live at /find-your-therapist (Hero w/ AI Matching CTA, How
  // GESA Works, founder spotlight, team & advisors, donate band) — a
  // straight content relocation, not a rewrite — and `/find-your-therapist`
  // itself is now an intentionally empty page (shared header/footer only)
  // so old bookmarks/links to it don't 404. The GESA logo (checked in the
  // next test) is the only remaining way to reach "/" from the nav bar.
  test("header nav links reach the right pages", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { name: /emotional support should feel human/i })).toBeVisible();

    await page.goto("/");
    await page.getByRole("link", { name: "Find Support" }).first().click();
    await expect(page).toHaveURL(/\/find-your-therapist$/);
    // Intentionally empty page — no heading, no former About/Find Support
    // content, just the shared header/footer chrome from the root layout.
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);

    await page.goto("/");
    await page.getByRole("link", { name: "Our Professionals" }).first().click();
    await expect(page).toHaveURL(/\/therapists$/);
    await expect(page.getByRole("heading", { name: /verified volunteer therapists/i })).toBeVisible();

    await page.getByRole("link", { name: "Community" }).first().click();
    await expect(page).toHaveURL(/\/support-groups$/);
  });

  // Phase 215 — the GESA logo (header and footer) must always open Home,
  // regardless of which page it's clicked from — including from the new
  // /about page, which is the page most likely to be mistaken for Home
  // before this phase (see the test above).
  test("the GESA logo always opens Home, even from /about", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("link", { name: "GESA" }).first().click();
    await expect(page).toHaveURL(/\/$/);
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
