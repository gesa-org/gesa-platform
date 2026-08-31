import { NextResponse } from "next/server";
import { sendEmailSafely } from "@/lib/email/resend";
import { donationNotificationEmail, donationReceivedEmail } from "@/lib/email/templates";

const GESA_INBOX = process.env.GESA_CONTACT_INBOX || "hello@gesa.org";

// Phase 98 — best-effort notification pair for the new /donate page's gift
// form, same pattern as /api/email/volunteer-application: the pledge itself
// is already saved to the `donations` table by the time this is called (see
// components/donate/DonateForm.tsx), so a failure here never loses the
// pledge, only the confirmation/notification emails.
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
      subject: "We received your gift pledge to GESA",
      html: donationReceivedEmail(fullName, frequency, amount),
    }),
    sendEmailSafely({
      to: GESA_INBOX,
      subject: `New donation pledge: ${fullName || email} — €${amount}`,
      html: donationNotificationEmail({ fullName, email, phone, frequency, amount, amountChoice, message }),
    }),
  ]);

  return NextResponse.json({ toDonor, toTeam });
}
