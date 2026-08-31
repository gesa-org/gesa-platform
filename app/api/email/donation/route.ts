import { NextResponse } from "next/server";
import { sendEmailSafely } from "@/lib/email/resend";
import { donationNotificationEmail, donationReceivedEmail } from "@/lib/email/templates";

const GESA_INBOX = process.env.GESA_CONTACT_INBOX || "hello@gesa.org";

// Phase 98 — best-effort notification pair for the /donate page's gift
// form, same pattern as /api/email/volunteer-application.
//
// Phase 99 — no longer called directly from DonateForm.tsx. Once the gift
// form was wired to real Mollie checkout, sending a "thank you" the instant
// someone submits the form (before they've actually paid) would be
// misleading — a donor who abandons checkout would still get a thank-you
// email. This is now called from app/api/webhooks/mollie/route.ts only
// after Mollie confirms the payment actually cleared, keeping the one
// shared email-sending route instead of duplicating the
// sendEmailSafely/template calls inline in the webhook handler.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fullName = (body?.fullName as string | undefined) ?? "";
  const email = body?.email as string | undefined;
  const phone = (body?.phone as string | undefined) ?? null;
  const frequency = (body?.frequency as string | undefined) ?? "once";
  const amount = Number(body?.amount ?? 0);
  const amountChoice = (body?.amountChoice as string | undefined) ?? null;
  const message = (body?.message as string | undefined) ?? null;

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const [toDonor, toTeam] = await Promise.all([
    sendEmailSafely({
      to: email,
      subject: "Thank you for your gift to GESA",
      html: donationReceivedEmail(fullName, frequency, amount),
    }),
    sendEmailSafely({
      to: GESA_INBOX,
      subject: `Donation paid: ${fullName || email} — €${amount}`,
      html: donationNotificationEmail({ fullName, email, phone, frequency, amount, amountChoice, message }),
    }),
  ]);

  return NextResponse.json({ toDonor, toTeam });
}
