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
  // Phase 215 flagged that having "About" click through to Home (same page,
  // same interface) was confusing, and moved the Find Support content
  // (Hero w/ AI Matching CTA, How GESA Works, founder spotlight, team &
  // advisors, donate band) from /find-your-therapist to /about so "About"
  // had a real destination of its own, leaving /find-your-therapist
  // intentionally empty.
  //
  // Phase 217 (this test's own update) — Roy then asked for the Community
  // page's full content to move onto Find Support, which surfaced a
  // conflict with Phase 215's move: confirmed with Roy that the Find
  // Support content itself belongs back at /find-your-therapist (undoing
  // that part of Phase 215) rather than staying split across two pages, so
  // /find-your-therapist now carries both the original Find Support content
  // AND the transferred Community content (PageHero banner, "Why GESA
  // exists"/pathway cards, the group listing/registration flow,
  // testimonials) appended after it, behind a new "Explore More Ways to
  // Receive Support" transition heading. /about and /support-groups are
  // both intentionally empty now — the GESA logo (checked in the next test)
  // is the only nav-bar way back to Home.
  test("header nav links reach the right pages", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page).toHaveURL(/\/about$/);
    // Intentionally empty page — no former content, just the shared
    // header/footer chrome from the root layout.
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);

    await page.goto("/");
    await page.getByRole("link", { name: "Find Support" }).first().click();
    await expect(page).toHaveURL(/\/find-your-therapist$/);
    await expect(page.getByRole("heading", { name: /emotional support should feel human/i })).toBeVisible();
    // The transferred Community content lives further down this same page.
    await expect(page.getByRole("heading", { name: "Explore More Ways to Receive Support" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Why GESA exists" })).toBeVisible();

    await page.goto("/");
    await page.getByRole("link", { name: "Our Professionals" }).first().click();
    await expect(page).toHaveURL(/\/therapists$/);
    await expect(page.getByRole("heading", { name: /verified volunteer therapists/i })).toBeVisible();

    await page.getByRole("link", { name: "Community" }).first().click();
    await expect(page).toHaveURL(/\/support-groups$/);
    // Also intentionally empty now — the content that used to be here moved
    // to /find-your-therapist, checked above.
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  });

  // Phase 215 — the GESA logo (header and footer) must always open Home,
  // regardless of which page it's clicked from. Checked from /about, which
  // is empty as of Phase 217 but was the page most likely to be mistaken
  // for Home before Phase 215.
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
