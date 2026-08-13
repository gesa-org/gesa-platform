import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("shows Sign In when logged out, and it links to /login", async ({ page }) => {
    await page.goto("/");
    const signIn = page.getByRole("link", { name: "Sign In" });
    await expect(signIn).toBeVisible();
    await signIn.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login rejects a bad password with a visible error, not a silent failure", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nonexistent-qa-user@example.com");
    await page.getByLabel("Password").fill("wrong-password-123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator("form p")).toBeVisible({ timeout: 10_000 });
  });

  test("messages route redirects an anonymous visitor to /login", async ({ page }) => {
    await page.goto("/messages");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("signup form requires a minimum password length", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "8");
  });
});
