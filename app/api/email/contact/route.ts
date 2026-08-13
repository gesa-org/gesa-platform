import { NextResponse } from "next/server";
import { sendEmailSafely } from "@/lib/email/resend";
import { contactNotificationEmail, contactReceivedEmail } from "@/lib/email/templates";

const GESA_INBOX = process.env.GESA_CONTACT_INBOX || "hello@gesa.org";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = (body?.name as string | undefined) ?? "";
  const email = body?.email as string | undefined;
  const subject = (body?.subject as string | undefined) ?? "";
  const message = (body?.message as string | undefined) ?? "";

  if (!email || !message) {
    return NextResponse.json({ error: "email and message are required" }, { status: 400 });
  }

  const [toSender, toTeam] = await Promise.all([
    sendEmailSafely({
      to: email,
      subject: "We received your message",
      html: contactReceivedEmail(name, subject),
    }),
    sendEmailSafely({
      to: GESA_INBOX,
      subject: `New inquiry: ${subject || "General"}`,
      html: contactNotificationEmail(name, email, subject, message),
    }),
  ]);

  return NextResponse.json({ toSender, toTeam });
}
