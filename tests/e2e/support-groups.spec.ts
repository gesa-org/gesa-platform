import { test, expect } from "@playwright/test";

// Phase 157 — every support group in the database is `status: "coming_soon"`
// (no facilitator, schedule, or session has ever actually been confirmed for
// any of the six seeded groups — see components/SupportGroupsInteractive.tsx's
// own Phase 157 comment). This spec previously asserted the *old* behavior
// (fake facilitator/schedule text visible, a working Register form) — updated
// to match the new coming-soon state instead of the retired one. If a real
// group is ever flipped to `status: "active"` with real details filled in,
// these tests should be revisited (or a second, "at least one active group"
// spec added) to cover that path again.
test.describe("Support Groups", () => {
  test("cards show a Coming Soon badge, not fabricated facilitator/schedule details", async ({ page }) => {
    await page.goto("/support-groups");
    await expect(page.getByRole("heading", { name: "Diaspora Voices" })).toBeVisible();
    await expect(page.getByText("Coming Soon").first()).toBeVisible();
    await expect(page.getByText("This community session is currently being prepared.")).toBeVisible();
    // The old, fabricated seed data must never render anywhere on this page.
    await expect(page.getByText("Ari Goldberg")).not.toBeVisible();
    await expect(page.getByText("Dr. Priya Nair")).not.toBeVisible();
    await expect(page.getByText("GESA Community Room, Berlin")).not.toBeVisible();
  });

  test("clicking a card opens an unavailable-state panel, not a registration form", async ({ page }) => {
    await page.goto("/support-groups");
    await page.getByRole("button", { name: /grief companions.*coming soon/i }).click();
    await expect(page.getByText("This support group is not yet available")).toBeVisible();
    await expect(page.getByRole("button", { name: "Register" })).not.toBeVisible();
    await expect(page.getByLabel("Email")).not.toBeVisible();

    await expect(page.getByRole("link", { name: "Explore Other Support Options" })).toHaveAttribute(
      "href",
      "/therapists"
    );
    await page.getByRole("button", { name: "Back to Community" }).click();
    await expect(page.getByText("This support group is not yet available")).not.toBeVisible();
  });
});
