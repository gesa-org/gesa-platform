import type { DonateThankYouContent } from "@/lib/content";

// Content Manager audit pass — app/donate/thank-you/page.tsx's three status
// states (paid, failed-like, still-processing) were all hardcoded with no
// site_content key backing them. These literals are exactly today's live
// copy, so publishing the seeded row changes nothing visually until an
// admin actually edits it. Kept in a sibling file (not page.tsx itself)
// since Next's App Router route files only allow a fixed set of exports —
// same reason app/intake/intakeContent.ts exists as its own file.
export const DONATE_THANK_YOU_CONTENT_FALLBACK: DonateThankYouContent = {
  published: true,
  paidHeading: "Thank you for your gift",
  paidBody:
    "Your payment has been confirmed. A receipt and confirmation email are on their way — your generosity helps gifted professional support reach more people, across borders.",
  failedHeading: "Your payment didn't go through",
  failedBody:
    "No charge was made. If this wasn't intentional, you're welcome to try again — or reach out and we'll help directly.",
  pendingHeading: "Finishing up your gift",
  pendingBody:
    "We're confirming your payment with our payment provider — this only takes a moment. You'll receive a confirmation email as soon as it clears.",
  backLinkLabel: "Back to GESA",
};
