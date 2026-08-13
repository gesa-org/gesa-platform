import { test, expect } from "@playwright/test";

test.describe("Contact form", () => {
  test("prefills the subject from the query string", async ({ page }) => {
    await page.goto("/contact?subject=Donation");
    await expect(page.getByLabel("Subject")).toHaveValue("Donation");
  });

  test("blocks submission until required fields are filled", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: /send message/i }).click();
    // Native HTML5 validation should keep us on the page — no thank-you message yet.
    await expect(page.getByText(/thank you/i)).not.toBeVisible();
  });

  test("submitting a complete form shows the confirmation state", async ({ page }) => {
    // Stub the network calls this test isn't trying to verify, so it stays
    // focused on UI behavior and doesn't depend on Supabase/Resend being live.
    await page.route("**/rest/v1/inquiries*", (route) =>
      route.fulfill({ status: 201, body: "{}" })
    );
    await page.route("**/api/email/contact", (route) => route.fulfill({ status: 200, body: "{}" }));

    await page.goto("/contact");
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Message").fill("This is a QA smoke test message.");
    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page.getByText(/thank you/i)).toBeVisible();
  });
});
